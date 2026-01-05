import ResponsiveAppBar from "../components/navbar";
import Footer from "../components/footer";

export default function PoliticaPrivacidad() {
  return (
    <>
      <ResponsiveAppBar backgroundColor/>   


      <div className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Política de Privacidad
          </h1>

          <p className="text-gray-600 mb-4">
            En <span className="font-semibold">Universidad Politécnica Territorial</span>, 
            respetamos tu privacidad y nos comprometemos a proteger tus datos personales. 
            Esta política describe cómo recopilamos, usamos y protegemos tu información.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            1. Información que recopilamos
          </h2>
          <p className="text-gray-600 mb-4">
            Podemos recopilar datos como tu nombre, correo electrónico, número de teléfono 
            y cualquier información que decidas proporcionarnos al usar nuestros servicios 
            o formularios de contacto.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            2. Uso de la información
          </h2>
          <p className="text-gray-600 mb-4">
            Utilizamos tu información para responder a tus consultas, mejorar nuestros 
            servicios y enviarte información relevante. Nunca compartiremos tus datos 
            con terceros sin tu consentimiento.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            3. Seguridad
          </h2>
          <p className="text-gray-600 mb-4">
            Implementamos medidas de seguridad para proteger tus datos personales contra 
            accesos no autorizados, alteraciones o divulgaciones indebidas.
          </p>

          <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
            4. Tus derechos
          </h2>
          <p className="text-gray-600 mb-4">
            Tienes derecho a acceder, rectificar o eliminar tus datos personales en 
            cualquier momento. Si deseas ejercer estos derechos, contáctanos a través 
            de nuestro correo electrónico oficial.
          </p>

          <div className="mt-8 border-t pt-4 text-sm text-gray-500">
            Última actualización: 30 de agosto de 2025
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}         
