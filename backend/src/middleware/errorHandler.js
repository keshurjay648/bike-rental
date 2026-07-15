import multer from "multer";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
}

export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image too large (max 5 MB)"
        : err.message || "Upload failed";
    return res.status(400).json({ success: false, message });
  }

  if (err.message && /Only JPEG|images are allowed/i.test(err.message)) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
}
