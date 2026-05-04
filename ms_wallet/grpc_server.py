import sys
import os
import grpc
from concurrent import futures

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(CURRENT_DIR)

try:
    import wallet_pb2
    import wallet_pb2_grpc
except ImportError as e:
    print(f"ERROR: No se encontraron los archivos generados de gRPC: {e}")
    print("\nSOLUCIÓN: Ejecuta este comando en tu terminal (desde la raíz):")
    print("pipenv run python -m grpc_tools.protoc -I./common/protos --python_out=./ms-wallet --grpc_python_out=./ms-wallet ./common/protos/wallet.proto")
    sys.exit(1)

class WalletServicer(wallet_pb2_grpc.WalletServiceServicer):
    def GetBalance(self, request, context):
        print(f"Petición de saldo para usuario: {request.user_id}")
        return wallet_pb2.BalanceResponse(balance=1000.0, currency="USD")

    def ValidateFunds(self, request, context):
        print(f"Validando fondos: {request.user_id} | Monto: {request.amount}")
        is_valid = request.amount <= 1000.0
        return wallet_pb2.FundsResponse(
            is_valid=is_valid, 
            message="OK" if is_valid else "Saldo insuficiente"
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    wallet_pb2_grpc.add_WalletServiceServicer_to_server(WalletServicer(), server)
    
    server.add_insecure_port('[::]:50051')
    print("Servidor gRPC de Billetera iniciado en el puerto 50051...")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()