import crypto from 'crypto'
import FileType from 'file-type'
import mime from 'mime'
import { IImgInfo } from 'picgo/dist/src/types'

class FileNameGenerator {
  date: Date
  info: IImgInfo

  static fields = [
    'year',
    'month',
    'day',
    'fullName',
    'fileName',
    'extName',
    'md5',
    'sha1',
    'sha256'
  ]

  constructor (info: IImgInfo) {
    this.date = new Date()
    this.info = info
  }

  public year (): string {
    return `${this.date.getFullYear()}`
  }

  public month (): string {
    return this.date.getMonth() < 9
      ? `0${this.date.getMonth() + 1}`
      : `${this.date.getMonth() + 1}`
  }

  public day (): string {
    return this.date.getDate() < 9
      ? `0${this.date.getDate()}`
      : `${this.date.getDate()}`
  }

  public fullName (): string {
    return this.info.fileName
  }

  public fileName (): string {
    return this.info.fileName.replace(this.info.extname, '')
  }

  public extName (): string {
    return this.info.extname.replace('.', '')
  }

  public md5 (): string {
    return crypto.createHash('md5').update(this.imgBuffer()).digest('hex')
  }

  public sha1 (): string {
    return crypto.createHash('sha1').update(this.imgBuffer()).digest('hex')
  }

  public sha256 (): string {
    return crypto.createHash('sha256').update(this.imgBuffer()).digest('hex')
  }

  private imgBuffer (): string | Buffer {
    return this.info.base64Image
      ? this.info.base64Image
      : this.info.buffer
  }
}

export function formatPath (info: IImgInfo, format?: string): string {
  if (!format) {
    return info.fileName
  }

  const fileNameGenerator = new FileNameGenerator(info)

  let formatPath: string = format

  for (let key of FileNameGenerator.fields) {
    const re = new RegExp(`{${key}}`, 'g')
    formatPath = formatPath.replace(re, fileNameGenerator[key]())
  }

  return formatPath
}

export async function extractInfo(info: IImgInfo): Promise<{
  body?: Buffer
  contentType?: string
  contentEncoding?: string
}> {
  let result: {
    body?: Buffer
    contentType?: string
    contentEncoding?: string
  } = {}

  if (info.base64Image) {
    const body = info.base64Image.replace(/^data:[/\w]+;base64,/, '')
    result.contentType = info.base64Image.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)?.[0]
    result.body = Buffer.from(body, 'base64')
    result.contentEncoding = 'base64'
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