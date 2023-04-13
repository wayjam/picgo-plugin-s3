import crypto from "crypto"
import FileType from "file-type"
import mime from "mime"
import { IImgInfo } from "picgo"
import { HttpsProxyAgent, HttpProxyAgent } from "hpagent"

class FileNameGenerator {
  date: Date
  info: IImgInfo

  static fields = [
    "year",
    "month",
    "day",
    "fullName",
    "fileName",
    "extName",
    "md5",
    "md5B64",
    "md5B64Short",
    "sha1",
    "sha256",
  ]

  constructor(info: IImgInfo) {
    this.date = new Date()
    this.info = info
  }

  public year(): string {
    return `${this.date.getFullYear()}`
  }

  public month(): string {
    return this.date.getMonth() < 9
      ? `0${this.date.getMonth() + 1}`
      : `${this.date.getMonth() + 1}`
  }

  public day(): string {
    return this.date.getDate() < 9
      ? `0${this.date.getDate()}`
      : `${this.date.getDate()}`
  }

  public fullName(): string {
    return this.info.fileName
  }

  public fileName(): string {
    return this.info.fileName.replace(this.info.extname, "")
  }

  public extName(): string {
    return this.info.extname.replace(".", "")
  }

  public md5(): string {
    return crypto.createHash("md5").update(this.imgBuffer()).digest("hex")
  }

  public md5B64(): string {
    return crypto
      .createHash("md5")
      .update(this.imgBuffer())
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }

  public md5B64Short(): string {
    return crypto
      .createHash("md5")
      .update(this.imgBuffer())
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .slice(0, 7)
  }

  public sha1(): string {
    return crypto.createHash("sha1").update(this.imgBuffer()).digest("hex")
  }

  public sha256(): string {
    return crypto.createHash("sha256").update(this.imgBuffer()).digest("hex")
  }

  private imgBuffer(): string | Buffer {
    return this.info.base64Image ? this.info.base64Image : this.info.buffer
  }
}

export function formatPath(info: IImgInfo, format?: string): string {
  if (!format) {
    return info.fileName
  }

  const fileNameGenerator = new FileNameGenerator(info)

  let formatPath: string = format

  for (const key of FileNameGenerator.fields) {
    const re = new RegExp(`{${key}}`, "g")
    formatPath = formatPath.replace(re, fileNameGenerator[key]())
  }

  return formatPath
}

export async function extractInfo(info: IImgInfo): Promise<{
  body?: Buffer
  contentType?: string
  contentEncoding?: string
}> {
  const result: {
    body?: Buffer
    contentType?: string
    contentEncoding?: string
  } = {}

  if (info.base64Image) {
    const body = info.base64Image.replace(/^data:[/\w]+;base64,/, "")
    result.contentType = info.base64Image.match(
      /[^:]\w+\/[\w-+\d.]+(?=;|,)/
    )?.[0]
    result.body = Buffer.from(body, "base64")
    result.contentEncoding = "base64"
  } else {
    if (info.extname) {
      result.contentType = mime.getType(info.extname)
    }
    result.body = info.buffer
  }

  // fallback to detect from buffer
  if (!result.contentType) {
    const fileType = await FileType.fromBuffer(result.body)
    result.contentType = fileType?.mime
  }

  return result
}

function formatHttpProxyURL(url = ""): string {
  if (!url) return ""

  if (!/^https?:\/\//.test(url)) {
    const [host, port] = url.split(":")
    return `http://${host.replace("127.0.0.1", "localhost")}:${port}`
  }

  try {
    const { protocol, hostname, port } = new URL(url)
    return `${protocol}//${hostname.replace("127.0.0.1", "localhost")}:${port}`
  } catch (e) {
    return ""
  }
}

export function getProxyAgent(
  proxy: string | undefined,
  sslEnabled: boolean,
  rejectUnauthorized: boolean
): HttpProxyAgent | HttpsProxyAgent | undefined {
  const formatedProxy = formatHttpProxyURL(proxy)
  if (!formatedProxy) {
    return undefined
  }

  const Agent = sslEnabled ? HttpsProxyAgent : HttpProxyAgent
  const options = {
    keepAlive: true,
    keepAliveMsecs: 1000,
    scheduling: "lifo" as "lifo" | "fifo" | undefined,
    rejectUnauthorized,
    proxy: formatedProxy,
  }

  return new Agent(options)
}
