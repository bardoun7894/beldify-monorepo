import { NextResponse } from "next/server";
import https from "node:https";

const isDevelopment = process.env.NODE_ENV === "development";

function fetchBackendHealth(url: string): Promise<Record<string, unknown>> {
	return new Promise((resolve, reject) => {
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(url);
		} catch {
			reject(new Error(`Invalid URL: ${url}`));
			return;
		}
		const options: https.RequestOptions = {
			hostname: parsedUrl.hostname,
			port: parsedUrl.port || 443,
			path: parsedUrl.pathname + parsedUrl.search,
			method: "GET",
			headers: { Accept: "application/json" },
			timeout: 10000,
			family: 4, // Force IPv4 — Docker containers may lack IPv6 connectivity
		};

		const req = https.request(options, (res) => {
			let data = "";
			res.on("data", (chunk: Buffer) => {
				data += chunk.toString();
			});
			res.on("end", () => {
				try {
					resolve(JSON.parse(data));
				} catch {
					reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
				}
			});
		});

		req.on("error", reject);
		req.on("timeout", () => {
			req.destroy();
			reject(new Error("Request timeout"));
		});
		req.end();
	});
}

export async function GET() {
	try {
		const backendUrl =
			process.env.NEXT_PUBLIC_API_URL || "http://18.100.117.252";
		const backendStatus = await fetchBackendHealth(`${backendUrl}/api/health`);

		return NextResponse.json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,
			backend: backendStatus,
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			version: process.env.npm_package_version || "unknown",
			backendUrl,
			isProduction: !isDevelopment,
		});
	} catch (error) {
		const errCause = error instanceof Error ? error.cause : undefined;
		const causeMsg =
			errCause instanceof Error ? errCause.message : String(errCause ?? "");
		return NextResponse.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : "Unknown error",
				cause: causeMsg || undefined,
				stack:
					error instanceof Error
						? error.stack?.split("\n").slice(0, 3)
						: undefined,
				environment: process.env.NODE_ENV,
				isProduction: !isDevelopment,
			},
			{ status: 503 },
		);
	}
}
