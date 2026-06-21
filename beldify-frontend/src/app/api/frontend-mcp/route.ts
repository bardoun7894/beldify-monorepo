import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import logger from '@/utils/consoleLogger';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// Validate API key — fails closed if MCP_API_KEY is not configured
function validateApiKey(request: NextRequest): boolean {
  const configured = process.env.MCP_API_KEY;
  if (!configured) return false;
  const apiKey = request.headers.get('x-api-key');
  return apiKey === configured;
}

// Safe path resolution
function getSafePath(relativePath: string): string {
  const basePath = process.cwd();
  const resolvedPath = path.resolve(basePath, relativePath);
  const relative = path.relative(basePath, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Access denied: Path outside project directory');
  }
  return resolvedPath;
}

// MCP Tools implementation
const mcpTools = {
  async read_frontend_file(params: { path: string }) {
    const filePath = getSafePath(params.path);
    const content = await fs.readFile(filePath, 'utf-8');
    return { content, path: params.path };
  },

  async write_frontend_file(params: { path: string; content: string }) {
    const filePath = getSafePath(params.path);
    await fs.writeFile(filePath, params.content, 'utf-8');
    return { success: true, path: params.path };
  },

  async list_structure(params: { directory?: string; depth?: number }) {
    const dir = params.directory || '.';
    const maxDepth = params.depth || 3;
    const basePath = getSafePath(dir);

    async function getStructure(currentPath: string, currentDepth: number): Promise<any> {
      if (currentDepth > maxDepth) return null;

      const stats = await fs.stat(currentPath);
      const name = path.basename(currentPath);

      if (!stats.isDirectory()) {
        return { name, type: 'file' };
      }

      const entries = await fs.readdir(currentPath);
      const children = await Promise.all(
        entries
          .filter(entry => !entry.startsWith('.') && entry !== 'node_modules')
          .map(entry => getStructure(path.join(currentPath, entry), currentDepth + 1))
      );

      return {
        name,
        type: 'directory',
        children: children.filter(Boolean)
      };
    }

    return await getStructure(basePath, 0);
  },

  async run_npm_command(params: { command: string; args?: string[] }) {
    const allowedCommands = ['build', 'dev', 'lint', 'test', 'start'];

    if (!allowedCommands.includes(params.command)) {
      throw new Error(`Command not allowed: ${params.command}`);
    }

    // Sanitize args to prevent shell injection — only alphanumeric, hyphens, dots, equals, underscores, slashes
    const safeArgs = (params.args || [])
      .map(a => String(a))
      .filter(a => /^[a-zA-Z0-9_.=/-]+$/.test(a));

    const { stdout, stderr } = await execFileAsync('npm', ['run', params.command, ...safeArgs]);

    return {
      stdout,
      stderr,
      command: `npm run ${params.command} ${safeArgs.join(' ')}`
    };
  },

  async analyze_code(params: { path: string }) {
    const filePath = getSafePath(params.path);
    const content = await fs.readFile(filePath, 'utf-8');

    // Basic code analysis
    const analysis = {
      path: params.path,
      lines: content.split('\n').length,
      size: content.length,
      imports: [] as string[],
      exports: [] as string[],
      functions: [] as string[],
      components: [] as string[]
    };

    // Extract imports
    const importMatches = content.matchAll(/import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      analysis.imports.push(match[1]);
    }

    // Extract exports
    const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:const|function|class|interface|type)\s+(\w+)/g);
    for (const match of exportMatches) {
      analysis.exports.push(match[1]);
    }

    // Extract functions
    const functionMatches = content.matchAll(/(?:function|const|let|var)\s+(\w+)\s*(?:=\s*)?(?:\([^)]*\)|async)/g);
    for (const match of functionMatches) {
      analysis.functions.push(match[1]);
    }

    // Extract React components (simple heuristic)
    const componentMatches = content.matchAll(/(?:function|const)\s+([A-Z]\w+)\s*(?:=|\()/g);
    for (const match of componentMatches) {
      analysis.components.push(match[1]);
    }

    return analysis;
  },

  async get_dependencies() {
    const packageJsonPath = getSafePath('package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    return {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      scripts: packageJson.scripts || {}
    };
  },

  async get_environment() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        PORT: process.env.PORT || '3000'
      }
    };
  }
};

export async function POST(request: NextRequest) {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };

  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { tool, params } = body;

    // Check if tool exists
    if (!tool || !(tool in mcpTools)) {
      return NextResponse.json(
        { error: `Unknown tool: ${tool}` },
        { status: 400 }
      );
    }

    // Execute tool
    const result = await (mcpTools as any)[tool](params || {});

    return NextResponse.json({
      success: true,
      tool,
      result
    }, { headers: corsHeaders });

  } catch (error: any) {
    logger.error('Frontend MCP Error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        tool: 'unknown'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };

  // Status endpoint
  return NextResponse.json({
    status: 'healthy',
    server: 'frontend-mcp',
    version: '1.0.0',
    tools: Object.keys(mcpTools),
    timestamp: new Date().toISOString()
  }, { headers: corsHeaders });
}

export async function OPTIONS(request: NextRequest) {
  // Handle preflight requests
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}