/**
 * Salles Socket.io : worker_<ObjectId>, admin_room, client_<ObjectId>
 * Toujours normaliser workerId en string pour coïncider avec le front.
 */
function workerRoomId(workerId) {
  return `worker_${String(workerId)}`;
}

function notifyWorker(io, workerId, event, data) {
  const room = workerRoomId(workerId);
  io.to(room).emit(event, data);
}

function notifyAdmin(io, event, data) {
  io.to('admin_room').emit(event, data);
}

function notifyClient(io, clientId, event, data) {
  io.to(`client_${String(clientId)}`).emit(event, data);
}

function initMatchingSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join_worker_room', (workerId) => {
      if (workerId == null || workerId === '') return;
      const room = workerRoomId(workerId);
      socket.join(room);
    });

    socket.on('join_admin_room', () => {
      socket.join('admin_room');
    });

    socket.on('join_client_room', (clientId) => {
      if (clientId == null || clientId === '') return;
      socket.join(`client_${String(clientId)}`);
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = initMatchingSocket;
module.exports.notifyWorker = notifyWorker;
module.exports.notifyAdmin = notifyAdmin;
module.exports.notifyClient = notifyClient;
module.exports.workerRoomId = workerRoomId;
