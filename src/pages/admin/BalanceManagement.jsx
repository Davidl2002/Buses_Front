import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, TrendingDown, Bus } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function BalanceManagement() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      const response = await api.get('/dashboard/balance-by-bus');
      setBalances(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar el balance');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const getTotals = () => {
    return balances.reduce(
      (acc, item) => ({
        ingresos: acc.ingresos + item.ingresos,
        gastos: acc.gastos + item.gastos,
        gananciaNeta: acc.gananciaNeta + item.gananciaNeta,
        tickets: acc.tickets + item.ticketsVendidos,
      }),
      { ingresos: 0, gastos: 0, gananciaNeta: 0, tickets: 0 }
    );
  };

  const totals = getTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando balance...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Balance por Bus</h1>
        <p className="text-gray-600 mt-2">
          Resumen de ingresos, gastos y ganancias por unidad
        </p>
      </div>

      {/* Resumen General */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.ingresos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.tickets} tickets vendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Totales
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.gastos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gastos operativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancia Neta
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.gananciaNeta)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Balance general
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Buses Activos
            </CardTitle>
            <Bus className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balances.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unidades en operación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Balance por Bus */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Bus</CardTitle>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay datos de balance disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Nº Interno</TableHead>
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Ganancia Neta</TableHead>
                    <TableHead className="text-center">Tickets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance) => (
                    <TableRow key={balance.bus.id}>
                      <TableCell className="font-medium">
                        {balance.bus.placa}
                      </TableCell>
                      <TableCell>{balance.bus.numeroInterno}</TableCell>
                      <TableCell className="text-gray-600">
                        {balance.bus.marca} {balance.bus.modelo}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        {formatCurrency(balance.ingresos)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">
                        {formatCurrency(balance.gastos)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${balance.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(balance.gananciaNeta)}
                      </TableCell>
                      <TableCell className="text-center">
                        {balance.ticketsVendidos}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
