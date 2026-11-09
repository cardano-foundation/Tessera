import type { Component } from "solid-js";

import { REPOSITORY_URL } from "~/ui/components/Footer";
import kit from "~/ui/kit.module.css";
import {
  FOUNDATION_TERMS_URL,
  PRIVACY_EMAIL,
  VERCEL_PRIVACY_URL,
} from "./links";

export const TermsFr: Component = () => (
  <>
    <p>
      Tessera est un site web pour créer, parcourir et répondre à des sondages
      publiés sur la blockchain Cardano. Il est exploité par Cardano Stiftung
      (Cardano Foundation). En l'utilisant, vous acceptez les présentes
      conditions. Votre utilisation de ce site est également régie par les{" "}
      <a class={kit.link} href={FOUNDATION_TERMS_URL} hreflang="en">
        conditions générales
      </a>{" "}
      de la Cardano Foundation. En cas de divergence, la version anglaise de
      cette page fait foi.
    </p>

    <h2>Conditions d'utilisation</h2>
    <ul>
      <li>
        <b>Publication.</b> Les sondages et les réponses sont publiés sur la
        blockchain Cardano, où chacun peut les lire et où personne, pas même
        nous, ne peut les modifier ni les supprimer. N'y incluez aucune
        information personnelle vous concernant ou concernant d'autres
        personnes, comme un nom, une adresse e-mail ou tout autre élément
        d'identification, ni aucune information confidentielle.
      </li>
      <li>
        <b>Sondages scellés.</b> Une réponse scellée n'est chiffrée que jusqu'à
        la date de révélation du sondage. Passé cette date, chacun peut la lire.
      </li>
      <li>
        <b>Votre portefeuille.</b> Tessera ne détient jamais vos clés ni vos
        fonds. Les transactions sont construites dans votre navigateur, puis
        signées et soumises par votre portefeuille. Les frais de réseau payés
        pour une transaction ne peuvent pas être remboursés. Vérifiez chaque
        transaction avant de la signer.
      </li>
      <li>
        <b>Contenus de tiers.</b> Chacun peut publier un sondage. Nous ne
        rédigeons, ne vérifions ni n'approuvons les sondages affichés ici, les
        documents vers lesquels ils renvoient, ni les réponses qu'ils reçoivent.
      </li>
      <li>
        <b>Absence de garantie.</b> Tessera est un logiciel libre, disponible{" "}
        <a class={kit.link} href={REPOSITORY_URL}>
          sur GitHub
        </a>
        . Les résultats sont calculés à partir de données publiques de la
        blockchain, et chacun peut les recalculer. Ce site est fourni « en
        l'état », sans garantie d'aucune sorte, et peut changer ou être
        indisponible à tout moment. Dans la mesure permise par la loi, la
        Cardano Foundation décline toute responsabilité pour les pertes
        résultant de son utilisation.
      </li>
    </ul>

    <h2>Politique de confidentialité</h2>
    <p>
      Cardano Stiftung (Cardano Foundation) est responsable du traitement des
      données personnelles en lien avec ce site.
    </p>

    <h3>Ce que nous collectons</h3>
    <p>
      Il n'y a pas de compte, et nous ne vous demandons ni votre nom ni votre
      adresse e-mail. Tant que vous ne l'avez pas publié, ce que vous saisissez
      reste dans votre navigateur.
    </p>

    <h3>Ce qui est public</h3>
    <p>
      Tout ce que vous publiez est public sur la blockchain Cardano, ainsi que
      sa date de publication. Pour répondre à un sondage, vous prouvez que vous
      détenez un rôle, par exemple DRep ou opérateur de pool de staking : votre
      réponse est donc liée à l'identifiant public de ce rôle et au portefeuille
      qui a payé la transaction. Une réponse en texte libre, ou l'ensemble de
      vos réponses, peut aussi suffire à vous reconnaître. Réfléchissez bien à
      ce que vous publiez.
    </p>

    <h3>Ce qui reste dans votre navigateur</h3>
    <p>
      Vos réglages, vos brouillons et vos transactions en attente, ainsi que les
      jetons d'accès que vous saisissez pour l'épinglage IPFS ou Koios, sont
      conservés dans le stockage local de votre navigateur. Ils ne sont jamais
      envoyés à notre serveur. Un jeton n'est envoyé qu'au service auquel il
      appartient.
    </p>

    <h3>Ce que conserve notre serveur</h3>
    <p>
      Notre serveur conserve une copie des données publiques de la blockchain
      que Tessera affiche. Notre hébergeur,{" "}
      <a class={kit.link} href={VERCEL_PRIVACY_URL} hreflang="en">
        Vercel
      </a>
      , traite votre adresse IP pour faire fonctionner et sécuriser le site, et
      conserve les journaux de notre serveur quelques jours au plus. Nous
      n'utilisons ni cookies ni outils d'analyse.
    </p>

    <h3>Services contactés par votre navigateur</h3>
    <p>
      Certaines fonctions amènent votre navigateur à contacter directement
      d'autres services. Ceux-ci voient votre adresse IP et appliquent leur
      propre politique de confidentialité : votre portefeuille ; le réseau
      drand, pour les sondages scellés ; les passerelles IPFS publiques et les
      adresses web choisies par les auteurs de sondages, pour afficher les
      documents liés ; les services d'épinglage IPFS que vous configurez, pour
      téléverser des documents ; et Koios, lorsque Tessera lit la blockchain
      sans passer par notre serveur.
    </p>

    <h3>Base juridique</h3>
    <p>
      Dans la mesure où des données personnelles sont traitées en lien avec ce
      site, nous le faisons conformément à la loi fédérale suisse sur la
      protection des données (LPD) et, lorsque le RGPD s'applique, sur la base
      de notre intérêt légitime à exploiter ce site, au sens de l'article
      6(1)(f) du RGPD.
    </p>

    <h2>Vos droits en matière de protection des données</h2>
    <p>
      Vous pouvez disposer de certains droits sur vos données personnelles en
      vertu des lois applicables en matière de protection des données. Pour en
      savoir plus sur la façon dont nous traitons les données personnelles, sur
      vos droits et sur la manière de les exercer, consultez la politique de
      confidentialité de la Cardano Foundation ou écrivez-nous à{" "}
      <a class={kit.link} href={`mailto:${PRIVACY_EMAIL}`}>
        {PRIVACY_EMAIL}
      </a>
      . Notez que personne ne peut modifier ni supprimer ce qui est enregistré
      sur la blockchain.
    </p>

    <h2>Modifications</h2>
    <p>
      Nous pouvons mettre à jour ces conditions. La date en haut de cette page
      indique leur dernière modification.
    </p>
  </>
);
