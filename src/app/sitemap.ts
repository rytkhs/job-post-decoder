import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString()

  return [
    {
      url: 'https://black-checker.vercel.app',
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ]
}
