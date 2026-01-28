import { describe, it, expect } from 'vitest'
import { FileNameGenerator } from '../utils'
import { IImgInfo } from 'picgo'

describe('FileNameGenerator.format', () => {
  it('should format path with sha256 range patterns: screenshots/{sha256:0,2}/{sha256:2,2}/{sha256}.{extName}', () => {
    // Create a mock IImgInfo with a known buffer
    const mockBuffer = Buffer.from('test image content')
    const mockInfo: IImgInfo = {
      fileName: 'test.png',
      extname: '.png',
      buffer: mockBuffer,
      imgSize: {
        width: 100,
        height: 100,
      },
    }

    const generator = new FileNameGenerator(mockInfo)
    
    // Calculate expected sha256 hash
    const expectedSha256 = generator.sha256()
    
    // Test the complete pattern with multiple pattern types in one string
    const pattern = 'screenshots/{sha256:0,2}/{sha256:2,2}/{sha256}.{extName}'
    const result = generator.format(pattern)
    
    // Expected result breakdown:
    // {sha256:0,2} -> first 2 characters starting at position 0
    // {sha256:2,2} -> 2 characters starting at position 2
    // {sha256} -> full sha256 hash
    // {extName} -> 'png' (without dot)
    const expected = `screenshots/${expectedSha256.substring(0, 2)}/${expectedSha256.substring(2, 4)}/${expectedSha256}.png`
    
    expect(result).toBe(expected)
  })

  it('should handle multiple different range patterns correctly', () => {
    const mockBuffer = Buffer.from('another test content')
    const mockInfo: IImgInfo = {
      fileName: 'image.jpg',
      extname: '.jpg',
      buffer: mockBuffer,
      imgSize: {
        width: 200,
        height: 200,
      },
    }

    const generator = new FileNameGenerator(mockInfo)
    const sha256 = generator.sha256()
    
    // Test with different range combinations
    const pattern = '{sha256:0,4}/{sha256:4,4}/{sha256:8,8}.{extName}'
    const result = generator.format(pattern)
    
    const expected = `${sha256.substring(0, 4)}/${sha256.substring(4, 8)}/${sha256.substring(8, 16)}.jpg`
    
    expect(result).toBe(expected)
  })

  it('should handle truncate pattern {sha256:10}', () => {
    const mockBuffer = Buffer.from('truncate test')
    const mockInfo: IImgInfo = {
      fileName: 'test.png',
      extname: '.png',
      buffer: mockBuffer,
      imgSize: {
        width: 100,
        height: 100,
      },
    }

    const generator = new FileNameGenerator(mockInfo)
    const sha256 = generator.sha256()
    
    const pattern = '{sha256:10}.{extName}'
    const result = generator.format(pattern)
    
    const expected = `${sha256.substring(0, 10)}.png`
    
    expect(result).toBe(expected)
  })

  it('should handle simple pattern without range', () => {
    const mockBuffer = Buffer.from('simple test')
    const mockInfo: IImgInfo = {
      fileName: 'test.png',
      extname: '.png',
      buffer: mockBuffer,
      imgSize: {
        width: 100,
        height: 100,
      },
    }

    const generator = new FileNameGenerator(mockInfo)
    const sha256 = generator.sha256()
    
    const pattern = '{sha256}.{extName}'
    const result = generator.format(pattern)
    
    const expected = `${sha256}.png`
    
    expect(result).toBe(expected)
  })
})
