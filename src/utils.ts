import crypto from "crypto"
import path from "path"
import { fromBuffer } from "file-type"
import mime from "mime"
import { IImgInfo } from "picgo"
import { HttpsProxyAgent, HttpProxyAgent } from "hpagent"
import { IS3UserConfig } from "./config"

class Generateor {
  readonly date: Date

  constructor(date?: Date) {
    if (date) {
      this.date = date
    } else {
      this.date = new Date()
    }
  }

  protected year(): string {
    return this.date.getFullYear().toString()
  }

  protected month(): string {
    return (this.date.getMonth() + 1).toString().padStart(2, '0')
  }

  protected day(): string {
    return this.date.getDate().toString().padStart(2, '0')
  }

  protected hour(): string {
    return this.date.getHours().toString().padStart(2, '0')
  }

  protected minute(): string {
    return this.date.getMinutes().toString().padStart(2, '0')
  }

  protected second(): string {
    return this.date.getSeconds().toString().padStart(2, '0')
  }

  protected millisecond(): string {
    return this.date.getMilliseconds().toString().padStart(3, '0')
  }

  protected timestamp(): string {
    return Math.floor(this.date.getTime() / 1000).toString()
  }

  protected timestampMS(): string {
    return this.date.getTime().toString()
  }

  public format(s?: string): string {
    if (!s) {
      return ''
    }

    const formatters: Record<string, () => string> = {
      year: () => this.year(),
      month: () => this.month(),
      day: () => this.day(),
      hour: () => this.hour(),
      minute: () => this.minute(),
      second: () => this.second(),
      millisecond: () => this.millisecond(),
      timestamp: () => this.timestamp(),
      timestampMS: () => this.timestampMS(),
    }

    return Object.entries(formatters).reduce(
      (result, [key, formatter]) =>
        result.replace(new RegExp(`{${key}}`, 'g'), formatter()),
      s
    )
  }
}

export class FileNameGenerator extends Generateor {
  readonly info: IImgInfo

  constructor(info: IImgInfo) {
    super(info.uploadDate)
    this.info = info
  }

  public fullName(): string {
    return this.info.fileName || ""
  }

  public fileName(): string {
    if (!this.info?.fileName) {
      return ''
    }
    const ext = this.info.extname || ''
    return this.info.fileName.replace(new RegExp(`${ext}$`), '')
  }

  public extName(): string {
    return this.info?.extname?.replace('.', '') || ''
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

  public imgBuffer(): string | Buffer {
    return this.info.base64Image ? this.info.base64Image : (this.info.buffer || "")
  }

  public format(s?: string): string {
    if (!s) {
      return this.fullName()
    }

    const formatters: Record<string, () => string> = {
      fullName: () => this.fullName(),
      fileName: () => this.fileName(),
      extName: () => this.extName(),
      md5: () => this.md5(),
      md5B64: () => this.md5B64(),
      md5B64Short: () => this.md5B64Short(),
      sha1: () => this.sha1(),
      sha256: () => this.sha256(),
    }

    return Object.entries(formatters).reduce(
      (result, [key, formatter]) => {
        const simplePattern = new RegExp(`{${key}}`, 'g')
        const truncatePattern = new RegExp(`{${key}:(\\d+)}`, 'g')

        if (truncatePattern.test(result)) {
          result = result.replace(truncatePattern, (match, length) => {
            const value = formatter()
            const truncateLength = parseInt(length, 10)
            return value.substring(0, truncateLength)
          })
        } else {
          result = result.replace(simplePattern, formatter())
        }
        return result
      },
      super.format(s)
    )
  }
}

export class OutputURLGenerator extends Generateor {
  readonly _config: IS3UserConfig

  readonly _protocol: string
  readonly _host: string
  readonly _port: string
  readonly _path: string
  readonly _query: string
  readonly _hash: string
  readonly _info: IImgInfo

  constructor(config: IS3UserConfig, info: IImgInfo) {
    super(info.uploadDate)
    this._config = config
    this._info = info

    // parse the url from storage
    const url = info.url || info.imgUrl || ''

    try {
      const u = new URL(url)
      this._protocol = u.protocol
      this._host = u.hostname
      this._port = u.port
      this._path = u.pathname
      this._query = u.search
      this._hash = u.hash
    } catch (e) {
      console.error(`Failed to parse URL: ${url}`, e)
    }
  }

  public protocol(): string {
    if (this._protocol) {
      return this._protocol.replace(/(:)$/, '')
    }
    return "https"
  }

  public host(): string {
    return this._host
  }

  public port(): string {
    return this._port
  }

  public path(): string {
    return this._path.replace(/^(\/)/, '')
  }

  public fileName(): string {
    if (this._info.fileName) {
      return this._info.fileName
    }
    return path.basename(this.path()) // will fallback to the uploaded filename.
  }

  public extName(): string {
    if (this._info.extname) {
      return this._info.extname.replace(/^./, '')
    }
    return path.extname(this.path()).replace(/^./, '') // will fallback to the uploaded file extname.
  }

  public dir(): string {
    return path.dirname(this.path())
  }

  public uploadedFileName(): string {
    return path.basename(this.path())
  }

  public originalURL(): string {
    let url = this._info.url
    if (!url) {
      url = this._info.imgUrl
    }
    return url
  }

  public query(): string {
    return this._query
  }

  public hash(): string {
    return this._hash
  }

  public bucket(): string {
    return this._config.bucketName
  }

  public legacyFormat(): string {
    let url = this.originalURL()

    let uploadPath = this._info.uploadPath || this.path()

    if (this._config.urlPrefix) {
      let urlPrefix = this._config.urlPrefix.replace(/\/?$/, "")
      if (this._config.pathStyleAccess && !this._config.disableBucketPrefixToURL) {
        urlPrefix += "/" + this._config.bucketName
      }
      url = `${urlPrefix}/${uploadPath}`
    }

    url = `${url}${this._config.urlSuffix || ''}`

    return url
  }

  public format(): string {
    if (!this._config.outputURLPattern) {
      return this.legacyFormat()
    }

    const formatters: Record<string, () => string> = {
      protocol: () => this.protocol(),
      host: () => this.host(),
      port: () => this.port(),
      dir: () => this.dir(),
      fileName: () => this.fileName(),
      path: () => this.path(),
      uploadedFileName: () => this.uploadedFileName(),
      extName: () => this.extName(),
      query: () => this.query(),
      hash: () => this.hash(),
      bucket: () => this.bucket(),
    }

    return Object.entries(formatters).reduce(
      (result, [key, formatter]) => {
        const simplePattern = new RegExp(`{${key}}`, "g")
        const advancedPattern = new RegExp(`{${key}:/(.*?)/(\\w)?,['"](.*)['"]}`, "g")

        if (advancedPattern.test(result)) {
          result = result.replace(advancedPattern, (match, p1, p2, p3) => {
            const r = formatter()
            return p2 ? r.replace(new RegExp(p1, p2), p3) : r
          })
        } else {
          result = result.replace(simplePattern, formatter())
        }
        return result
      },
      super.format(this._config.outputURLPattern)
    )
  }
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
      /[^:]\w+\/[\w-+\d.]+(?=;|,)/,
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
    const fileType = await fromBuffer(result.body)
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
  rejectUnauthorized: boolean,
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
