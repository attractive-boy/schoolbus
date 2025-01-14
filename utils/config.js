// 示例：根据环境切换配置
const ENV = 'prod'  // 可以通过构建工具或其他方式设置

const CONFIG = {
  dev: {
    BASE_URL: 'http://localhost:3000',
    IMAGE_BASE_URL: 'http://localhost:3000'
  },
  prod: {
    BASE_URL: 'https://bingshi.xn--vuqw0e54ixuh2wab7xjjnvyb7x0m.online',
    IMAGE_BASE_URL: 'https://bingshi.xn--vuqw0e54ixuh2wab7xjjnvyb7x0m.online'
  }
}

export const { BASE_URL, IMAGE_BASE_URL } = CONFIG[ENV]
export const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${IMAGE_BASE_URL}${path}`
} 