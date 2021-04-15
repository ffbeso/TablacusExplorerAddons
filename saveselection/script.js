const Addon_Id = "saveselection";
const Default = "ToolBar2Left";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");

	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		await SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.SaveSelection.Exec, this, 9)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || "icon:general,13"
		}, GetIconSizeEx(item)), '</span>']);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
