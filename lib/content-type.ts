export function guessFileExtensionByContentType(contentType: string) {
  switch (contentType) {
    case "text/csv":
      return "csv"
    case "application/json":
      return "json"
    case "text/markdown":
      return "md"
    case "application/pdf":
      return "pdf"
    case "text/plain":
      return "txt"
    case "text/html":
      return "html"
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx"
    case "application/msword":
      return "doc"
    case "application/vnd.ms-excel":
      return "xls"
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx"
    case "application/vnd.ms-powerpoint":
      return "ppt"
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "pptx"
    default:
      return contentType.split("/").pop() || contentType
  }
}
