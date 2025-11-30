export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">MoviPass</h3>
            <p className="text-gray-400 text-sm">
              Tu plataforma de confianza para comprar boletos de buses interprovinciales en Ecuador.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Enlaces</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-400 hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-400 hover:text-white transition-colors">
                  Acerca de
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Términos y Condiciones
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: info@movipass.ec</li>
              <li>Tel: +593 2 123-4567</li>
              <li>Dirección: Quito, Ecuador</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} MoviPass. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
