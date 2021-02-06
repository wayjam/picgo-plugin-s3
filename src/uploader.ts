import AWS from 'aws-sdk'
import fs from 'fs'
import { IImgInfo } from 'picgo/dist/src/types'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)

export interface IUploadResult {
  url: string
  imgURL: string
  index: number
}

function createS3Client(
  accessKeyID: string,
  secretAccessKey: string,
  region: string,
  endpoint: string
): AWS.S3 {
  const s3 = new AWS.S3({
    region,
    endpoint,
    accessKeyId: accessKeyID,
    secretAccessKey: secretAccessKey,
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
  return new Promise((resolve, reject) => {
    readFile(item.fileName)
      .then((content) => {
        s3.upload({
          Key: path,
          Body: content,
          Bucket: bucketName,
        })
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
      .catch((err) => reject(err))
  })
}

// export default uploader

export default {
  createS3Client,
  createUploadTask,
}
