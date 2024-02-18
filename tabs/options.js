g_win = MainWindow.g_.OptionsWindow;
g_doc = parent.document;

const tabs = document.getElementById('tabs');
const tab = document.getElementById('tab0');
tabs.removeChild(tab);
tabs.appendChild(tab);

const ar = (await ReadTextFile(BuildPath(ui_.Installed, "addons", Addon_Id, "options.html"))).split("<!--panel-->");
await SetTabContents(4, "General", ar[0]);
await SetTabContents(0, "Drag-and-Drop", ar[1]);

document.getElementById("_DropTo").innerHTML = (await GetTextR("@SRH.dll,-8110[Drop to %1]")).replace(/%1/, await GetText("Folder"));

SetText = function (o) {
	g_doc.F[o.name].value = o.value;
	g_win.g_Chg.Tab = true;
	g_win.g_bChanged = true;
}

SetRadio = function (o) {
	const ar = o.id.split("=");
	const el = g_doc.F[ar[0]];
	el.value = ar[1];
	FireEvent(el, "change");
}

SetCheckbox = async function (o) {
	const ar = o.id.split(":");
	const el = g_doc.F[ar[0]];
	const res = /0x([\da-f]+)/i.exec(ar[1]);
	const a = res ? parseInt(res[1], 16) : ar[1];
	if (o.checked) {
		el.value |= a;
	} else {
		el.value &= ~a;
	}
	FireEvent(el, "change");
}

SetCheckbox2 = function (o) {
	g_doc.F[o.id].checked = o.checked;
}

for (let i = 0; i < document.E.length; i++) {
	const o = document.E[i];
	const ar = o.id.split(":");
	if (ar.length > 1) {
		var res = /0x([\da-f]+)/i.exec(ar[1]);
		var a = res ? parseInt(res[1], 16) : ar[1];
		if (g_doc.F[ar[0]].value & a) {
			o.checked = true;
		}
	}
}
document.E.Tab_TabWidth.value = g_doc.F.Tab_TabWidth.value;
document.E.Tab_TabHeight.value = g_doc.F.Tab_TabHeight.value;
document.E["Tab_Align=" + (g_doc.F.Tab_Align.value || "0")].checked = true;
document.E.Conf_TabDefault.checked = g_doc.F.Conf_TabDefault.checked;

