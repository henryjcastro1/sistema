import 'package:intl/intl.dart';

class CurrencyFormatter {
  static String format(
    double value, {
    String currencyCode = 'COP',
    String? symbol,
  }) {
    switch (currencyCode) {
      case 'COP':
        return _formatCOP(value, symbol ?? '\$');
      case 'USD':
        return _formatUSD(value, symbol ?? '\$');
      case 'EUR':
        return _formatEUR(value, symbol ?? '€');
      default:
        return _formatDefault(value, symbol ?? '\$');
    }
  }

  static String _formatCOP(double value, String symbol) {
    final formatter = NumberFormat.currency(
      locale: 'es_CO',
      symbol: symbol,
      decimalDigits: 0,
    );
    return formatter.format(value);
  }

  static String _formatUSD(double value, String symbol) {
    final formatter = NumberFormat.currency(
      locale: 'en_US',
      symbol: symbol,
      decimalDigits: 2,
    );
    return formatter.format(value);
  }

  static String _formatEUR(double value, String symbol) {
    final formatter = NumberFormat.currency(
      locale: 'de_DE',
      symbol: symbol,
      decimalDigits: 2,
    );
    return formatter.format(value);
  }

  static String _formatDefault(double value, String symbol) {
    return '$symbol ${value.toStringAsFixed(2)}';
  }
}
