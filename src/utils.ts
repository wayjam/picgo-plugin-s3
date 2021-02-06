import crypto from 'crypto'
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
    'sha256',
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
    return this.date.getDay() < 9
      ? `0${this.date.getDay() + 1}`
      : `${this.date.getDay() + 1}`
  }

  public fullName(): string {
    return this.info.fileName
  }

  public fileName(): string {
    return this.info.fileName.replace(this.info.extname, '')
  }

  public extName(): string {
    return this.info.extname.replace('.', '')
  }

  public md5(): string {
    return crypto.createHash('md5').update(this.imgBuffer()).digest('hex')
  }

  public sha1(): string {
    return crypto.createHash('sha1').update(this.imgBuffer()).digest('hex')
  }

  public sha256(): string {
    return crypto.createHash('sha256').update(this.imgBuffer()).digest('hex')
  }

  private imgBuffer(): string {
    return this.info.base64Image
      ? this.info.base64Image
      : this.info.buffer.toString()
  }
}

export function formatPath(info: IImgInfo, format?: string): string {
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
