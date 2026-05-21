// Official consent document content in all 4 languages
// Text sourced from the official HOMS authorization PDFs

const HOMS = 'HOSPITAL METROPOLITANO DE SANTIAGO, S.A. (HOMS)';

export interface ConsentContent {
    docTitle: string;
    screenTitle: string;
    intro1: string;
    intro2: string;
    intro3: string;
    items: string[];
    getClosing: (dateLabel: string) => string;
    signatureLabel: string;
    nameLabel: string;
    idLabel: string;
    clearSignature: string;
}

export const consentContent: Record<string, ConsentContent> = {
    es: {
        docTitle: 'AUTORIZACIÓN PARA USO DE IMAGEN',
        screenTitle: 'Autorización para Uso de Imagen',
        intro1: `Por medio de la presente AUTORIZO a la sociedad ${HOMS}, para utilizar las fotografías o videograbaciones que incluyan mi voz e imagen (en cualquier soporte) en el programa televisivo "Bienestar al Día", así como en campañas, promocionales y demás material que consideren pertinentes para la difusión y promoción del ${HOMS}, y que se distribuyan en el país o en el extranjero por cualquier medio, ya sea impreso, electrónico o de otro tipo.`,
        intro2: `Asimismo, en el entendido de que derechos a la intimidad, el honor y a la propia imagen es un derecho fundamental en virtud del artículo 44 de la Constitución de la República Dominicana, tengo a bien expresar que esta autorización es libre, voluntaria y totalmente gratuita.`,
        intro3: `Esta autorización se regirá por las normas legales aplicables y en particular por las siguientes:`,
        items: [
            `El ${HOMS} es libre de utilizar, reproducir, transmitir, retransmitir, mostrar públicamente, crear otras obras derivadas de mi imagen en el programa televisivo "Bienestar al Día", así como en las campañas de promoción que realice por cualquier medio, así como la fijación de mi imagen en cualquier soporte, ya sea videos, graficas, filminas y todo material suplementario del programa, las promociones y campañas, estableciendo que se utilizará única y exclusivamente para estos fines.`,
            `Este video/foto podrá ser utilizado con fines educativos, informativos y publicitarios en diferentes escenarios y plataformas del ${HOMS}.`,
            `Este video/foto podrá ser utilizado en el ámbito nacional e internacional.`,
            `Esta autorización no tiene límite de tiempo para su concesión, ni para su explotación, ya sea total o parcial, por lo que esta autorización es concedida por un plazo de tiempo ilimitado.`,
            `Autorizo el uso de mi nombre y de los datos personales facilitados para los fines señalados.`,
            `Autorizo el uso de cualquier comentario que pudiere haber hecho mientras grababa el video, así como, que tal comentario sea editado con los fines señalados o citado en otros medios.`,
            `Autorizo al ${HOMS} a utilizar los Derechos de Autor, Los Derechos Conexos y en general cualquier derecho de propiedad intelectual que tengan que ver con el derecho de imagen.`,
            `El ${HOMS} queda exento de cualquier responsabilidad que pueda derivarse directa o indirectamente de la presente actividad y otorgo formal descargo y finiquito legal a su favor con la firma de la presente autorización.`,
        ],
        getClosing: (d) => `Firmo libre y voluntariamente la presente autorización en señal de que la he leído y estoy de acuerdo con los términos y condiciones contenidos en la misma. En esta ciudad de Santiago de los Caballeros, provincia de Santiago, República Dominicana, a los ${d}.`,
        signatureLabel: 'Firma autorización',
        nameLabel: 'Nombre y Apellido',
        idLabel: 'Núm. Cédula o Pasaporte',
        clearSignature: 'Limpiar firma',
    },

    en: {
        docTitle: 'AUTHORIZATION FOR USE OF IMAGE',
        screenTitle: 'Authorization for Use of Image',
        intro1: `By means of this document, I AUTHORIZE the company ${HOMS} to use photographs or video recordings that include my voice and image, in any format, in the television program "Bienestar al Día", as well as in campaigns, promotional materials, and any other material deemed relevant for the dissemination and promotion of ${HOMS}, whether distributed nationally or internationally by any means, including printed, electronic, or any other type of media.`,
        intro2: `Likewise, understanding that the rights to privacy, honor, and one's own image are fundamental rights pursuant to Article 44 of the Constitution of the Dominican Republic, I hereby state that this authorization is granted freely, voluntarily, and completely free of charge.`,
        intro3: `This authorization shall be governed by the applicable legal regulations, and in particular by the following provisions:`,
        items: [
            `${HOMS} is free to use, reproduce, transmit, retransmit, publicly display, and create other derivative works from my image in the television program "Bienestar al Día", as well as in promotional campaigns carried out by any means, including the fixation of my image in any format, whether videos, graphics, slides, or any supplementary material of the program, promotions, and campaigns, establishing that it shall be used solely and exclusively for these purposes.`,
            `This video/photo may be used for educational, informational, and advertising purposes in different settings and platforms of ${HOMS}.`,
            `This video/photo may be used nationally and internationally.`,
            `This authorization has no time limit for its granting or exploitation, whether total or partial; therefore, this authorization is granted for an unlimited period of time.`,
            `I authorize the use of my name and the personal data provided for the purposes indicated.`,
            `I authorize the use of any comment I may have made while recording the video, as well as the editing of such comment for the stated purposes or its citation in other media.`,
            `I authorize ${HOMS} to use Copyrights, Related Rights, and, in general, any intellectual property rights related to the right of image.`,
            `${HOMS} is released from any liability that may arise directly or indirectly from this activity, and I formally grant release and legal discharge in its favor by signing this authorization.`,
        ],
        getClosing: (d) => `I freely and voluntarily sign this authorization as confirmation that I have read it and agree with the terms and conditions contained herein. In the city of Santiago de los Caballeros, province of Santiago, Dominican Republic, on the ${d}.`,
        signatureLabel: 'Authorization signature',
        nameLabel: 'Full name',
        idLabel: 'ID card or passport number',
        clearSignature: 'Clear signature',
    },

    fr: {
        docTitle: "AUTORISATION D'UTILISATION DE L'IMAGE",
        screenTitle: "Autorisation d'utilisation d'image",
        intro1: `Par la présente, J'AUTORISE la société ${HOMS} à utiliser les photographies ou enregistrements vidéo incluant ma voix et mon image, sur tout support, dans le programme télévisé « Bienestar al Día », ainsi que dans les campagnes, supports promotionnels et tout autre matériel jugé pertinent pour la diffusion et la promotion de ${HOMS}, distribués dans le pays ou à l'étranger par tout moyen, qu'il soit imprimé, électronique ou autre.`,
        intro2: `De même, étant entendu que les droits à la vie privée, à l'honneur et à sa propre image constituent des droits fondamentaux en vertu de l'article 44 de la Constitution de la République dominicaine, je déclare que la présente autorisation est accordée librement, volontairement et entièrement à titre gratuit.`,
        intro3: `La présente autorisation sera régie par les dispositions légales applicables et, en particulier, par les dispositions suivantes :`,
        items: [
            `${HOMS} est libre d'utiliser, reproduire, transmettre, retransmettre, diffuser publiquement et créer d'autres œuvres dérivées de mon image dans le programme télévisé « Bienestar al Día », ainsi que dans les campagnes promotionnelles réalisées par tout moyen, y compris la fixation de mon image sur tout support, qu'il s'agisse de vidéos, graphiques, diapositives ou tout autre matériel complémentaire du programme, des promotions et des campagnes, étant établi qu'elle sera utilisée uniquement et exclusivement à ces fins.`,
            `Cette vidéo/photo pourra être utilisée à des fins éducatives, informatives et publicitaires dans différents contextes et plateformes de ${HOMS}.`,
            `Cette vidéo/photo pourra être utilisée au niveau national et international.`,
            `La présente autorisation n'a pas de limite de durée quant à sa concession ni quant à son exploitation, qu'elle soit totale ou partielle ; par conséquent, cette autorisation est accordée pour une durée illimitée.`,
            `J'autorise l'utilisation de mon nom et des données personnelles fournies aux fins indiquées.`,
            `J'autorise l'utilisation de tout commentaire que j'aurais pu faire pendant l'enregistrement de la vidéo, ainsi que l'édition de ce commentaire aux fins indiquées ou sa citation dans d'autres médias.`,
            `J'autorise ${HOMS} à utiliser les droits d'auteur, les droits voisins et, de manière générale, tout droit de propriété intellectuelle lié au droit à l'image.`,
            `${HOMS} est exonéré de toute responsabilité pouvant découler directement ou indirectement de la présente activité, et j'accorde formellement décharge et quittance légale en sa faveur par la signature de la présente autorisation.`,
        ],
        getClosing: (d) => `Je signe librement et volontairement la présente autorisation en signe de confirmation que je l'ai lue et que j'accepte les termes et conditions qui y sont contenus. Dans la ville de Santiago de los Caballeros, province de Santiago, République dominicaine, le ${d}.`,
        signatureLabel: "Signature de l'autorisation",
        nameLabel: 'Nom et prénom',
        idLabel: "Numéro de carte d'identité ou de passeport",
        clearSignature: 'Effacer la signature',
    },

    de: {
        docTitle: 'EINWILLIGUNG ZUR NUTZUNG VON BILD- UND TONAUFNAHMEN',
        screenTitle: 'Einwilligung zur Bildnutzung',
        intro1: `Hiermit ERTEILE ICH der Gesellschaft ${HOMS} die Genehmigung, Fotografien oder Videoaufnahmen, die meine Stimme und mein Bild enthalten, in jeglichem Format im Fernsehprogramm „Bienestar al Día" sowie in Kampagnen, Werbematerialien und sonstigem Material zu verwenden, das für die Verbreitung und Förderung von ${HOMS} als geeignet erachtet wird, und zwar sowohl im Inland als auch im Ausland über jedes Medium, sei es gedruckt, elektronisch oder in anderer Form.`,
        intro2: `Ebenso erkläre ich, in dem Verständnis, dass die Rechte auf Privatsphäre, Ehre und das eigene Bild gemäß Artikel 44 der Verfassung der Dominikanischen Republik Grundrechte darstellen, dass diese Einwilligung frei, freiwillig und vollständig unentgeltlich erteilt wird.`,
        intro3: `Diese Einwilligung unterliegt den geltenden gesetzlichen Bestimmungen und insbesondere den folgenden Regelungen:`,
        items: [
            `${HOMS} ist berechtigt, mein Bild im Fernsehprogramm „Bienestar al Día" sowie in Werbekampagnen, die über jedes Medium durchgeführt werden, zu verwenden, zu vervielfältigen, zu übertragen, weiterzuübertragen, öffentlich zu zeigen und daraus abgeleitete Werke zu erstellen, einschließlich der Fixierung meines Bildes auf jeglichem Trägermedium, sei es in Form von Videos, Grafiken, Folien oder sonstigem ergänzenden Material des Programms, der Werbeaktionen und Kampagnen, wobei festgelegt wird, dass die Nutzung ausschließlich und einzig zu diesen Zwecken erfolgt.`,
            `Dieses Video/Foto darf zu Bildungs-, Informations- und Werbezwecken in verschiedenen Bereichen und auf verschiedenen Plattformen von ${HOMS} verwendet werden.`,
            `Dieses Video/Foto darf national und international verwendet werden.`,
            `Diese Einwilligung ist weder hinsichtlich ihrer Erteilung noch hinsichtlich ihrer vollständigen oder teilweisen Nutzung zeitlich begrenzt; daher wird diese Einwilligung für einen unbegrenzten Zeitraum erteilt.`,
            `Ich genehmige die Verwendung meines Namens und der bereitgestellten personenbezogenen Daten für die angegebenen Zwecke.`,
            `Ich genehmige die Verwendung jeglicher Kommentare, die ich während der Videoaufnahme gemacht haben könnte, sowie die Bearbeitung solcher Kommentare zu den genannten Zwecken oder deren Zitierung in anderen Medien.`,
            `Ich ermächtige ${HOMS}, Urheberrechte, verwandte Schutzrechte und allgemein alle Rechte des geistigen Eigentums zu nutzen, die mit dem Recht am eigenen Bild in Zusammenhang stehen.`,
            `${HOMS} wird von jeglicher Haftung befreit, die sich direkt oder indirekt aus dieser Tätigkeit ergeben könnte, und ich erteile durch die Unterzeichnung dieser Einwilligung formell eine rechtliche Entlastung und Freistellung zugunsten von HOMS.`,
        ],
        getClosing: (d) => `Ich unterzeichne diese Einwilligung frei und freiwillig als Bestätigung, dass ich sie gelesen habe und mit den darin enthaltenen Bedingungen einverstanden bin. In der Stadt Santiago de los Caballeros, Provinz Santiago, Dominikanische Republik, am ${d}.`,
        signatureLabel: 'Unterschrift der Einwilligung',
        nameLabel: 'Vor- und Nachname',
        idLabel: 'Personalausweis- oder Reisepassnummer',
        clearSignature: 'Signatur löschen',
    },
};

export function getConsentDateLabel(lang: string, dateStr?: string): string {
    const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
    const day = d.getDate();
    const year = d.getFullYear();

    const msES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const msEN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const msFR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const msDE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

    const ordEN = (n: number) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;

    switch (lang) {
        case 'en': return `${ordEN(day)} day of the month of ${msEN[d.getMonth()]} of the year ${year}`;
        case 'fr': return `${day}ème jour du mois de ${msFR[d.getMonth()]} de l'année ${year}`;
        case 'de': return `${day}. Tag des Monats ${msDE[d.getMonth()]} des Jahres ${year}`;
        default:   return `${day} días del mes de ${msES[d.getMonth()]} del año ${year}`;
    }
}
