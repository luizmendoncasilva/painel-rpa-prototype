import { useRouteError, isRouteErrorResponse } from 'react-router';

// ----------------------------------------------------------------------

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div
      style={{
        display: 'flex',
        flex: '1 1 auto',
        alignItems: 'center',
        padding: '10vh 15px 0',
        flexDirection: 'column',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: 'white',
        backgroundColor: '#2c2c2e',
        minHeight: '100vh',
        width: '100%',
        margin: 0,
      }}
    >
      <div
        style={{
          gap: 24,
          padding: 20,
          width: '100%',
          maxWidth: 960,
          display: 'flex',
          borderRadius: 8,
          flexDirection: 'column',
          backgroundColor: '#1c1c1e',
        }}
      >
        {renderErrorMessage(error)}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------

function parseStackTrace(stack: string | undefined): { filePath: string | null; functionName: string | null } {
  if (!stack) return { filePath: null, functionName: null };

  const filePathMatch = stack.match(/\/src\/[^?]+/);
  const functionNameMatch = stack.match(/at (\S+)/);

  return {
    filePath: filePathMatch ? filePathMatch[0] : null,
    functionName: functionNameMatch ? functionNameMatch[1] : null,
  };
}

const titleStyle = { margin: 0, lineHeight: 1.2, fontSize: 20, fontWeight: 700 };
const messageStyle = {
  margin: 0,
  lineHeight: 1.5,
  padding: '12px 16px',
  whiteSpace: 'pre-wrap' as const,
  color: '#ff5555',
  fontSize: 14,
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
  backgroundColor: '#2a1e1e',
  borderLeft: '2px solid #ff5555',
  fontWeight: 700,
};
const detailsStyle = {
  margin: 0,
  padding: 16,
  lineHeight: 1.5,
  overflow: 'auto' as const,
  borderRadius: 'inherit',
  color: '#e2aa53',
  backgroundColor: '#111111',
};
const filePathStyle = { marginTop: 0, color: '#2dd9da' };

function renderErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1 style={titleStyle}>
          {error.status}: {error.statusText}
        </h1>
        <p style={messageStyle}>{error.data}</p>
      </>
    );
  }

  if (error instanceof Error) {
    const { filePath, functionName } = parseStackTrace(error.stack);

    return (
      <>
        <h1 style={titleStyle}>Unexpected Application Error!</h1>
        <p style={messageStyle}>
          {error.name}: {error.message}
        </p>
        <pre style={detailsStyle}>{error.stack}</pre>
        {(filePath || functionName) && (
          <p style={filePathStyle}>
            {filePath} ({functionName})
          </p>
        )}
      </>
    );
  }

  return <h1 style={titleStyle}>Unknown Error</h1>;
}
