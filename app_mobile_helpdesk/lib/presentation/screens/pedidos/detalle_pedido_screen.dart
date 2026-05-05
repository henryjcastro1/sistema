import 'package:flutter/material.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/pedido.dart';
import '../pagos/pago_screen.dart'; // 👈 Agregar import

class DetallePedidoScreen extends StatelessWidget {
  final Pedido pedido;

  const DetallePedidoScreen({super.key, required this.pedido});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Pedido ${pedido.numeroPedido}',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Estado
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: pedido.estadoBackgroundColor,
              child: Row(
                children: [
                  Text(pedido.estadoIcon, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Estado del pedido',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        Text(
                          pedido.estadoTexto,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: pedido.estadoColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Información del pedido
                  _buildSection(
                    title: 'Información del pedido',
                    children: [
                      _buildInfoRow('Número', pedido.numeroPedido),
                      _buildInfoRow('Fecha', _formatFullDate(pedido.createdAt)),
                      if (pedido.updatedAt != null)
                        _buildInfoRow(
                          'Última actualización',
                          _formatFullDate(pedido.updatedAt!),
                        ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Dirección de envío
                  if (pedido.direccionEnvio != null) ...[
                    _buildSection(
                      title: 'Dirección de envío',
                      children: [
                        Text(
                          pedido.direccionEnvio!,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Productos
                  _buildSection(
                    title: 'Productos',
                    children: [
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: pedido.items.length,
                        separatorBuilder: (_, _) => const Divider(),
                        itemBuilder: (context, index) {
                          final item = pedido.items[index];
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  flex: 3,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.descripcion,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      Text(
                                        '${item.cantidad} x ${CurrencyFormatter.format(item.precioUnitario)}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  flex: 1,
                                  child: Text(
                                    CurrencyFormatter.format(item.subtotal),
                                    textAlign: TextAlign.right,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Resumen de pagos
                  _buildSection(
                    title: 'Resumen de pagos',
                    children: [
                      _buildSummaryRow('Subtotal', pedido.subtotal),
                      _buildSummaryRow('Impuesto', pedido.impuesto),
                      if (pedido.descuento > 0)
                        _buildSummaryRow(
                          'Descuento',
                          -pedido.descuento,
                          isNegative: true,
                        ),
                      _buildSummaryRow('Costo de envío', pedido.costoEnvio),
                      const Divider(height: 32),
                      _buildSummaryRow(
                        'Total',
                        pedido.totalFinal,
                        isTotal: true,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      // 👇 BOTÓN DE PAGO (solo si el pedido está pendiente)
      bottomNavigationBar: pedido.estado == 'PENDIENTE'
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.3),
                    spreadRadius: 1,
                    blurRadius: 5,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: SafeArea(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => PagoScreen(
                          pedidoId: pedido.id,
                          monto: pedido.totalFinal,
                          numeroPedido: pedido.numeroPedido,
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Pagar pedido',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(
    String label,
    double value, {
    bool isTotal = false,
    bool isNegative = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            isNegative
                ? '- ${CurrencyFormatter.format(-value)}'
                : CurrencyFormatter.format(value),
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isNegative
                  ? Colors.red
                  : (isTotal ? Colors.black : Colors.grey.shade700),
            ),
          ),
        ],
      ),
    );
  }

  String _formatFullDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} '
        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
