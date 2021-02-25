import AWS from 'aws-sdk'
import FileType from 'file-type'
import { PutObjectRequest } from 'aws-sdk/clients/s3'
import { IImgInfo } from 'picgo/dist/src/types'

export interface IUploadResult {
  url: string
  imgURL: string
  index: number
}

function createS3Client(
  accessKeyID: string,
  secretAccessKey: string,
  region: string,
  endpoint: string,
  pathStyleAccess: boolean
): AWS.S3 {
  const s3 = new AWS.S3({
    region,
    endpoint,
    accessKeyId: accessKeyID,
    secretAccessKey: secretAccessKey,
    s3ForcePathStyle: pathStyleAccess
  })
  return s3
}

function createUploadTask(
  s3: AWS.S3,
  bucketName: string,
  path: string,
  item: IImgInfo,
  index: number
): Promise<IUploadResult> {
  return new Promise(async (resolve, reject) => {
    if (!item.buffer && !item.base64Image) {
      reject(new Error('undefined image'))
    }
    const opts: PutObjectRequest = {
      Key: path,
      Bucket: bucketName,
    }
    if (item.buffer) {
      opts.Body = item.buffer
      // 不知道是否会发生未获取到 mime 类型就上传文件的情况
      const fileType = await FileType.fromBuffer(item.buffer)
      opts.ContentType = fileType.mime

    } else {
      let data = item.base64Image
      const format = data.substring(
        data.indexOf('data:') + 5,
        data.indexOf(';base64')
      )
      data = data.replace(/^data:image\/\w+;base64,/, '')
      const buf = Buffer.from(data, 'base64')
      opts.Body = buf
      opts.ContentEncoding = 'base64'
      opts.ContentType = format
    }
    s3.upload(opts)
      .promise()
      .then((result) => {
        resolve({
          url: result.Location,
          imgURL: result.Key,
          index,
        })
      })
      .catch((err) => reject(err))
  })
}

export default {
  createS3Client,
  createUploadTask,
}
