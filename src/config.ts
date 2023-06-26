export interface IS3UserConfig {
  accessKeyID: string
  secretAccessKey: string
  bucketName: string
  uploadPath: string
  region?: string
  endpoint?: string
  proxy?: string
  urlPrefix?: string
  pathStyleAccess?: boolean
  rejectUnauthorized?: boolean
  acl?: string
  disableBucketPrefixToURL?: boolean
}
