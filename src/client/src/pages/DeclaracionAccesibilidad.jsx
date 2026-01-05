import ResponsiveAppBar from "../components/navbar";
import Footer from "../components/footer";

export default function DeclaracionAccesibilidad() {

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <div className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Accesibilidad
          </h1>

          <p className="text-gray-600 mb-4">
            En la <span className="font-semibold">Universidad Politécnica Territorial</span>, 
            estamos comprometidos en garantizar que nuestra plataforma digital sea accesible 
            para todas las personas, incluyendo aquellas con discapacidades.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            1. Nuestro compromiso
          </h2>
          <p className="text-gray-600 mb-4">
            Trabajamos constantemente para mejorar la accesibilidad de nuestros contenidos, 
            asegurándonos de cumplir con las pautas internacionales de accesibilidad web (WCAG).
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            2. Medidas implementadas
          </h2>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
            <li>Compatibilidad con lectores de pantalla.</li>
            <li>Uso de colores con contraste adecuado.</li>
            <li>Navegación mediante teclado.</li>
            <li>Etiquetas descriptivas en formularios e imágenes.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            3. Recomendaciones para los usuarios
          </h2>
          <p className="text-gray-600 mb-4">
            Para una mejor experiencia, recomendamos mantener actualizado el navegador y 
            utilizar herramientas de accesibilidad disponibles en tu sistema operativo.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            4. Contacto
          </h2>
          <p className="text-gray-600 mb-4">
            Si encuentras alguna barrera de accesibilidad en nuestra plataforma, 
            te invitamos a contactarnos para poder mejorar. Escríbenos a nuestro 
            correo institucional y atenderemos tu solicitud.
          </p>

          <div className="mt-8 border-t pt-4 text-sm text-gray-500">
            Última actualización: 2 de septiembre de 2025
          </div>
        </div>
      </div>

      <Footer/>
    </>
  );
}
