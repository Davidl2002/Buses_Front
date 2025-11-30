export default function TestAdminPage({ title }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">
          Esta página está en desarrollo y será implementada próximamente.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Funcionalidad 1</h3>
          <p className="text-sm text-gray-600">Descripción de la funcionalidad</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Funcionalidad 2</h3>
          <p className="text-sm text-gray-600">Descripción de la funcionalidad</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Funcionalidad 3</h3>
          <p className="text-sm text-gray-600">Descripción de la funcionalidad</p>
        </div>
      </div>
    </div>
  );
}