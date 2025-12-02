import ResponsiveAppBar from "../components/navbar";
import Footer from "../components/footer";

export default function TerminosCondiciones() {
  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <div className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Términos y Condiciones
          </h1>

          <p className="text-gray-600 mb-4">
            Bienvenido a la plataforma de la 
            <span className="font-semibold"> Universidad Politécnica Territorial</span>. 
            Al acceder y utilizar nuestros servicios, aceptas los siguientes términos y condiciones.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            1. Aceptación de los términos
          </h2>
          <p className="text-gray-600 mb-4">
            El uso de esta plataforma implica la aceptación plena y sin reservas de todas las cláusulas 
            y condiciones incluidas en este documento. Si no estás de acuerdo, deberás abstenerte de utilizarla.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            2. Uso permitido
          </h2>
          <p className="text-gray-600 mb-4">
            Te comprometes a utilizar los servicios de forma lícita, sin infringir la normativa vigente, 
            los derechos de terceros, ni el orden público. El uso indebido podrá resultar en la suspensión de tu acceso.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            3. Propiedad intelectual
          </h2>
          <p className="text-gray-600 mb-4">
            Todos los contenidos de esta plataforma (textos, imágenes, logotipos, diseño, código) son propiedad de la universidad. 
            No se permite su reproducción, distribución o modificación sin autorización expresa.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            4. Responsabilidad
          </h2>
          <p className="text-gray-600 mb-4">
            La universidad no se hace responsable por daños o perjuicios derivados del uso indebido de la plataforma, 
            ni por interrupciones o fallos técnicos que puedan ocurrir.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            5. Modificaciones
          </h2>
          <p className="text-gray-600 mb-4">
            Nos reservamos el derecho de actualizar o modificar estos términos en cualquier momento. 
            Los cambios serán publicados en esta misma página.
          </p>

          <div className="mt-8 border-t pt-4 text-sm text-gray-500">
            Última actualización: 2 de septiembre de 2025
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
