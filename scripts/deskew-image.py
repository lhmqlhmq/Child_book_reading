import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps


def order_points(points):
    points = np.asarray(points, dtype=np.float32)
    total = points.sum(axis=1)
    diff = np.diff(points, axis=1).reshape(-1)
    return np.array([
        points[np.argmin(total)],
        points[np.argmin(diff)],
        points[np.argmax(total)],
        points[np.argmax(diff)],
    ], dtype=np.float32)


def find_page(image):
    height, width = image.shape[:2]
    scale = min(1.0, 1600.0 / max(height, width))
    small = cv2.resize(image, None, fx=scale, fy=scale) if scale < 1 else image
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(gray, 35, 120)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    image_area = small.shape[0] * small.shape[1]
    candidates = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < image_area * 0.18:
            continue
        perimeter = cv2.arcLength(contour, True)
        polygon = cv2.approxPolyDP(contour, 0.03 * perimeter, True)
        if len(polygon) == 4 and cv2.isContourConvex(polygon):
            candidates.append((area, polygon.reshape(4, 2)))
    if not candidates:
        return None
    _, points = max(candidates, key=lambda candidate: candidate[0])
    points = order_points(points / scale)
    return points


def transform(image, points):
    top_left, top_right, bottom_right, bottom_left = points
    width = int(max(np.linalg.norm(bottom_right - bottom_left), np.linalg.norm(top_right - top_left)))
    height = int(max(np.linalg.norm(top_right - bottom_right), np.linalg.norm(top_left - bottom_left)))
    if width < 100 or height < 100:
        return image
    destination = np.array([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]], dtype=np.float32)
    matrix = cv2.getPerspectiveTransform(points, destination)
    return cv2.warpPerspective(image, matrix, (width, height), borderMode=cv2.BORDER_REPLICATE)


def main(input_path, output_path):
    with Image.open(input_path) as source:
        oriented = ImageOps.exif_transpose(source).convert("RGB")
        rgb = np.asarray(oriented)
    image = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    points = find_page(image)
    result = transform(image, points) if points is not None else image
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(output_path, result, [int(cv2.IMWRITE_JPEG_QUALITY), 92])


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: deskew-image.py INPUT OUTPUT")
    main(sys.argv[1], sys.argv[2])
