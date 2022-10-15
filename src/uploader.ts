import S3 from "aws-sdk/clients/s3"
import { PutObjectRequest } from "aws-sdk/clients/s3"
import { IImgInfo } from "picgo/dist/src/types"
import { extractInfo } from "./utils"
import { IS3UserConfig } from "./config"

export interface IUploadResult {
  url: string
  imgURL: string
  index: number
}

function createS3Client(opts: IS3UserConfig): S3 {
  const endpointURL = new URL(opts.endpoint)
  const sslEnabled = endpointURL.protocol === "https"
  const http = sslEnabled ? require("https") : require("http")
  const s3 = new S3({
    region: opts.region,
    endpoint: opts.endpoint,
    accessKeyId: opts.accessKeyID,
    secretAccessKey: opts.secretAccessKey,
    s3ForcePathStyle: opts.pathStyleAccess,
    s3BucketEndpoint: opts.bucketEndpoint,
    sslEnabled: sslEnabled,
    httpOptions: {
      agent: new http.Agent({
        rejectUnauthorized: opts.rejectUnauthorized,
      }),
    },
  })
  return s3
}

function createUploadTask(
  s3: S3,
  bucketName: string,
  path: string,
  item: IImgInfo,
  index: number,
  acl: string
): Promise<IUploadResult> {
  return new Promise((resolve, reject) => {
    if (!item.buffer && !item.base64Image) {
      reject(new Error("undefined image"))
    }

    extractInfo(item)
      .then(({ body, contentType, contentEncoding }) => {
        const opts: PutObjectRequest = {
          Key: path,
          Bucket: bucketName,
          ACL: acl,
          Body: body,
          ContentType: contentType,
          ContentEncoding: contentEncoding,
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
      .catch((err) => {
        reject(err)
      })
  })
}

export default {
  createS3Client,
  createUploadTask,
}
