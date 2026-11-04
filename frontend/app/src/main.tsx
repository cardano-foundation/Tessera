/* @refresh reload */
import { render } from "solid-js/web";

import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "~/ui/theme.css";
import App from "~/App";

const root = document.getElementById("root");
if (!root) throw new Error('missing <div id="root">');

render(() => <App />, root);
