Sync.LockedTabsTop = {
	fn: [],

	Exec: function (Ctrl) {
		const FV = GetFolderView(Ctrl);
		if (FV) {
			const TC = FV.Parent;
			if (TC) {
				let ar = [];
				for (let i = TC.Count; --i >= 0;) {
					ar[i] = i;
				}
				ar.sort(function (a, b) {
					const fn = Sync.LockedTabsTop.fn;
					for (let i = 0; i < fn.length; ++i) {
						const d = fn[i][0](fn[i][1](TC[a]), fn[i][1](TC[b]));
						if (d) {
							return d;
						}
					}
				});
				TC.SetOrder(ar);
			}
		}
	},

	Cmp: function (a, b) {
		return b - a;
	},

	Get: function (FV) {
		return GetLock(FV) ? 1 : 0;
	}
}

Sync.LockedTabsTop.fn.push([Sync.LockedTabsTop.Cmp, Sync.LockedTabsTop.Get]);
Sync.LockedTabsTop.Exec();

AddEvent("NavigateComplete", Sync.LockedTabsTop.Exec);

AddEvent("Lock", Sync.LockedTabsTop.Exec);

AddEvent("Create", Sync.LockedTabsTop.Exec);

AddEvent("Load", function () {
	if (Sync.SortTabs && Sync.SortTabs.fn) {
		Sync.SortTabs.fn.unshift([Sync.LockedTabsTop.Cmp, Sync.LockedTabsTop.Get]);
	}
});
