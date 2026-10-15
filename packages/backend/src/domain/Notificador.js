import { DomainRuleError } from "./errors/DomainErrors.js";

export default class Notificador {
    async enviar(medios, contenido) {
        for(const medio of medios){
        switch (medio.tipo) {
            case "EMAIL":
                await this.enviarMail(medio.valor, contenido)
                break

            case "WHATSAPP":
                await this.enviarWhatsApp(medio.valor, contenido)
                break

            case "SMS":
                await this.enviarSMS(medio.valor, contenido)
                break

            default:
                throw new DomainRuleError(
                    `Medio de contacto no soportado: ${medio.tipo}`
                );
        }}
    }

    async enviarMail(destinatario, contenido) {    
        console.log(`Enviando Email a ${destinatario}: ${contenido}`);
    }

    async enviarWhatsApp(destinatario, contenido) {
        console.log(`Enviando WhatsApp a ${destinatario}: ${contenido}`);
    }

    async enviarSMS(destinatario, contenido) {
        console.log(`Enviando SMS a ${destinatario}: ${contenido}`);
    }
}