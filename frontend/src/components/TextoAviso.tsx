export const AVISO_VERSION = '1.0';

export default function TextoAviso() {
  return (
    <div className="ion-padding">
      <h2>Aviso de Privacidad Integral</h2>
      <p>
        <strong>Gestor Inteligente de Despensa</strong>
        <br />
        Versión {AVISO_VERSION} · Última actualización: 14/10/2026
      </p>

      <h3>1. Responsable del tratamiento</h3>
      <p>
        José Ortega Limón, estudiante de la Universidad Tecnológica de Aguascalientes, responsable
        del proyecto académico “Gestor Inteligente de Despensa”. Domicilio: Blvrd Juan Pablo II 1302, Ex hacienda la Cantera, 20200 Aguascalientes, Ags. 
        Correo de contacto para temas de privacidad: 230955@utags.edu.mx .
      </p>

      <h3>2. Datos personales que se recaban</h3>
      <ul>
        <li>Identificación: nombre.</li>
        <li>Contacto: correo electrónico.</li>
        <li>Autenticación: contraseña (se almacena cifrada; nadie puede leerla).</li>
        <li>Registro de tu consentimiento: fecha y versión de este aviso que aceptaste.</li>
        <li>Datos de uso de la app: alimentos y platillos que registres en tu inventario.</li>
      </ul>
      <p>No se recaban datos personales sensibles.</p>

      <h3>3. Finalidades del tratamiento</h3>
      <p>
        <strong>Finalidades necesarias</strong> (sin ellas no es posible darte el servicio):
      </p>
      <ul>
        <li>Crear y administrar tu cuenta.</li>
        <li>Verificar tu identidad cuando inicias sesión.</li>
        <li>Prestar las funciones de la app: inventario, alertas de caducidad y sugerencias.</li>
        <li>Conservar evidencia de que otorgaste tu consentimiento.</li>
      </ul>
      <p>
        <strong>Finalidades voluntarias:</strong> ninguna. Si en el futuro se agregara alguna, se te
        pedirá tu consentimiento de forma separada.
      </p>
      <p>
        El tratamiento para las finalidades necesarias se basa en tu consentimiento, que otorgas al
        marcar la casilla de aceptación al registrarte.
      </p>

      <h3>4. Transferencias</h3>
      <p>Tus datos personales no se venden ni se comparten con terceros.</p>

      <h3>5. Derechos ARCO y revocación del consentimiento</h3>
      <p>
        Tienes derecho a Acceder a tus datos, Rectificarlos, Cancelarlos u Oponerte a su tratamiento
        (derechos ARCO), así como a revocar tu consentimiento. Para ejercerlos, envía una solicitud
        al correo 230955@utags.edu.mx indicando tu nombre, el medio para responderte, la descripción clara
        del derecho que deseas ejercer y un documento que acredite tu identidad. Revocar el
        consentimiento implica que tu cuenta deberá darse de baja.
      </p>

      <h3>6. Medidas de seguridad</h3>
      <p>
        Las contraseñas se almacenan cifradas, el acceso a la información requiere iniciar sesión y
        los datos se guardan en una base de datos de acceso restringido.
      </p>

      <h3>7. Cambios a este aviso</h3>
      <p>
        Cualquier cambio se publicará en la aplicación con un nuevo número de versión. Si cambian las
        finalidades del tratamiento, se te pedirá nuevamente tu consentimiento.
      </p>

      <h3>8. Autoridad</h3>
      <p>
        Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes
        acudir a la Secretaría Anticorrupción y Buen Gobierno, autoridad en la materia.
      </p>
    </div>
  );
}