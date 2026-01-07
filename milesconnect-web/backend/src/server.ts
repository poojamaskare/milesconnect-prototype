import "dotenv/config";

import app from "./app";

// eslint-disable-next-line no-console
console.log("DB URL:", process.env.DATABASE_URL);

const port = (() => {
	const raw = process.env.PORT;
	if (!raw) return 3001;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : 3001;
})();

const server = app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`Backend listening on port ${port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
	// eslint-disable-next-line no-console
	console.error('Server error:', error);
	if (error.code === 'EADDRINUSE') {
		// eslint-disable-next-line no-console
		console.error(`Port ${port} is already in use`);
	}
});

process.on('unhandledRejection', (reason, promise) => {
	// eslint-disable-next-line no-console
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
	// eslint-disable-next-line no-console
	console.error('Uncaught Exception:', error);
});
