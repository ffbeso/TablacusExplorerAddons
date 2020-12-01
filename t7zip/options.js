var ar = (await ReadTextFile("addons\\" + Addon_Id + "\\options.html")).split("<!--panel-->");
SetTabContents(0, "Filter", ar[0]);
SetTabContents(1, "Path", ar[1]);
SetTabContents(2, "@shell32.dll,-12852", ar[2]);
var el = document.getElementById("_7zip");
el.value = api.sprintf(99, GetText("Get %s..."), "7-Zip");

if (await api.sizeof("HANDLE") == 4) {
	var strPath = "C:\\Program Files (x86)\\7-Zip\\7z.dll";
	var hDll = await api.LoadLibraryEx(strPath, 0, 0);
	if (hDll) {
		api.FreeLibrary(hDll);
		document.F.Dll32.setAttribute("placeholder", strPath);
		strPath = "C:\\Program Files (x86)\\7-Zip\\7zG.exe";
		if (await fso.FileExists(strPath)) {
			document.F.Exe32.setAttribute("placeholder", strPath);
		}
	}
}
