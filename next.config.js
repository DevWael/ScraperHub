/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/scraper/:path*',
        destination: '/api/scraper/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    
    // Fix for undici private class fields issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        worker_threads: false,
      };
      
      // Exclude problematic packages from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'undici': false,
        'cheerio': false,
        'turndown': false,
        'queue': false,
        'fs-extra': false,
        'axios': false,
      };
      
      // Add rule to ignore problematic modules
      config.module.rules.push({
        test: /node_modules[\\/](undici|cheerio|turndown|queue|fs-extra|axios)[\\/]/,
        use: 'null-loader',
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;
