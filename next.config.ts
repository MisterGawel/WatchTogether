import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	eslint: {
		// Next.js ne fera plus échouer ni même lancer ESLint lors de la build
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
