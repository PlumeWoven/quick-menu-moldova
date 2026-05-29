import serverHandler from '../dist/server/server.js';

export default function (request) {
  return serverHandler.fetch(request, process.env, {});
}
