/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost'
      }
    ]
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/en/dashboards/society',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/:lang/dashboards/society',
        permanent: true,
        locale: false
      },
    ]
  }
}

export default nextConfig
