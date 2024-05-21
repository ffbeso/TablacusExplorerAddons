const Addon_Id = "tabs";
const item = GetAddonElement(Addon_Id);

Sync.Tabs = {
	DropTo: !item.getAttribute("NoDropTo"),
	DragOpen: !item.getAttribute("NoDragOpen"),

	Init: function (Ctrl) {
		api.SendMessage(Ctrl.hwnd, WM_SETFONT, Sync.Tabs.hFont, 1);
		api.SendMessage(Ctrl.hwnd, TCM_SETIMAGELIST, 0, Sync.Tabs.himl);
	},

	Over: function () {
		const pt = api.Memory("POINT");
		api.GetCursorPos(pt);
		if (!IsDrag(pt, g_ptDrag)) {
			const Ctrl = te.CtrlFromPoint(pt);
			if (Ctrl && Ctrl.Type == CTRL_TC) {
				const nIndex = Ctrl.HitTest(pt, TCHT_ONITEM);
				if (nIndex >= 0) {
					Ctrl.SelectedIndex = nIndex;
				}
			}
		}
	}
};

AddEvent("ToolTip", function (Ctrl, Index) {
	if (Ctrl.Type == CTRL_TC) {
		const FV = Ctrl.Item(Index);
		if (FV) {
			return api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		}
	}
});

AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo) {
	if (Ctrl.Type == CTRL_TC) {
		if (!Sync.Tabs.DragTab) {
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				if (IsDrag(pt, te.Data.pt)) {
					g_.mouse.str = "";
					SetGestureText(Ctrl, "");
					te.Data.pt = null;
					const i = Ctrl.HitTest(pt, TCHT_ONITEM);
					if (i >= 0) {
						Sync.Tabs.DragTab = Ctrl;
						Sync.Tabs.DragIndex = i;
						const DataObj = api.CreateObject("FolderItems");
						DataObj.AddItem(Ctrl[i].FolderItem);
						DataObj.dwEffect = DROPEFFECT_LINK;
						DoDragDrop(DataObj, DROPEFFECT_LINK | DROPEFFECT_COPY | DROPEFFECT_MOVE, false, function () {
							Sync.Tabs.DragTab = null;
						});
					}
				}
			}
		}
	}
});

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_TC) {
		if (Sync.Tabs.DragTab) {
			pdwEffect[0] = DROPEFFECT_LINK;
		}
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_TC) {
		const nIndex = Ctrl.HitTest(pt, TCHT_ONITEM);
		if (nIndex >= 0 && Sync.Tabs.DragOpen) {
			if (IsDrag(pt, g_ptDrag)) {
				g_ptDrag = pt.Clone();
				InvokeUI("Addons.Tabs.setTimeout", Sync.Tabs.Over, 300);
			}
		}
		const nDragTab = Sync.Tabs.DragIndex;
		if (Sync.Tabs.DragTab && nDragTab >= 0) {
			pdwEffect[0] = DROPEFFECT_MOVE;
			return S_OK;
		}
		if (nIndex >= 0) {
			if (dataObj.Count && Sync.Tabs.DropTo) {
				const Target = Ctrl.Item(nIndex).FolderItem;
				if (!api.ILIsEqual(dataObj.Item(-1), Target)) {
					const DropTarget = api.DropTarget(Target);
					if (DropTarget) {
						hr = DropTarget.DragOver(dataObj, grfKeyState, pt, pdwEffect);
						return hr;
					}
				}
			}
			if (Sync.Tabs.DropTo) {
				pdwEffect[0] = DROPEFFECT_NONE;
				return S_OK;
			}
		}
		if (dataObj.Item(0) && dataObj.Item(0).IsFolder) {
			pdwEffect[0] = DROPEFFECT_LINK;
			return S_OK;
		}
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_TC) {
		let nIndex = Ctrl.HitTest(pt, TCHT_ONITEM);
		if (Sync.Tabs.DragTab) {
			pdwEffect[0] = DROPEFFECT_LINK;
			if (nIndex < 0) {
				nIndex = Ctrl.Count;
			}
			Sync.Tabs.DragTab.Move(Sync.Tabs.DragIndex, nIndex, Ctrl);
			Ctrl.SelectedIndex = nIndex;
		} else if (nIndex >= 0 && Sync.Tabs.DropTo) {
			let hr = S_FALSE;
			const DropTarget = Ctrl.Item(nIndex).DropTarget;
			if (DropTarget) {
				InvokeUI("Addons.Tabs.clearTimeout");
				hr = DropTarget.Drop(dataObj, grfKeyState, pt, pdwEffect);
			}
			return hr;
		} else if (dataObj.Count) {
			for (let i = 0; i < dataObj.Count; i++) {
				const FV = Ctrl.Selected.Navigate(dataObj.Item(i), SBSP_NEWBROWSER);
				Ctrl.Move(FV.Index, nIndex >= 0 ? nIndex : Ctrl.Count - 1);
			}
		}
	}
});

AddEvent("DragLeave", function (Ctrl) {
	if (Sync.Tabs.tid) {
		clearTimeout(Sync.Tabs.tid);
		delete Sync.Tabs.tid;
	}
	return S_OK;
});

AddEvent("TabViewCreated", function (Ctrl) {
	Sync.Tabs.Init(Ctrl);
});

AddEvent("Lock", function (Ctrl, i, bLock) {
	const tcItem = api.Memory("TCITEM");
	tcItem.mask = TCIF_IMAGE;
	tcItem.iImage = bLock ? 2 : -1;
	api.SendMessage(Ctrl.hwnd, TCM_SETITEM, i, tcItem);
	Resize();
});

AddEvent("FontChanged", function () {
	Sync.Tabs.hFont = CreateFont(DefaultFont);
});

AddEvent(WM_SETTINGCHANGE + "!", function (Ctrl, Type, hwnd, msg, wParam, lParam) {
	const cTC = te.Ctrls(CTRL_TC, true);
	for (let i in cTC) {
		api.InvalidateRect(cTC[i].hwnd, null, true);
	}
});

AddEvent("Finalize", function () {
	if (Sync.Tabs.himl) {
		api.ImageList_Destroy(Sync.Tabs.himl);
		Sync.Tabs.himl = null;
	}
});

AddEvent("Load", function () {
	if (WINVER >= 0x602) {
		const cx = 13 * 96 / screen.deviceYDPI;
		Sync.Tabs.himl = api.ImageList_Create(cx, cx, 32, 0, 0);
		const hIcon = MakeImgIcon("font:Segoe UI Emoji,0x1f4cc", 0, cx, false, CLR_DEFAULT | COLOR_BTNFACE);
		api.ImageList_AddIcon(Sync.Tabs.himl, hIcon);
		api.ImageList_AddIcon(Sync.Tabs.himl, hIcon);
		api.ImageList_AddIcon(Sync.Tabs.himl, hIcon);
		api.DestroyIcon(hIcon);
	} else {
		const hModule = api.GetModuleHandle(BuildPath(system32, "ieframe.dll"), 0, LOAD_LIBRARY_AS_DATAFILE) || api.GetModuleHandle(BuildPath(system32, "browseui.dll"), 0, LOAD_LIBRARY_AS_DATAFILE);
		if (hModule) {
			Sync.Tabs.himl = api.ImageList_LoadImage(hModule, 545, 13, 0, CLR_DEFAULT, IMAGE_BITMAP, LR_CREATEDIBSECTION);
		}
	}
	Sync.Tabs.hFont = CreateFont(DefaultFont);

	const cTC = te.Ctrls(CTRL_TC);
	for (let i in cTC) {
		Sync.Tabs.Init(cTC[i]);
	}
});
