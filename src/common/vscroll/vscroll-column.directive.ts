import { Directive, Input, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { sizeFactory } from './vscroll.container';
import { VscrollLayout } from 'ng2-qgrid/common/vscroll/vscroll.layout';

@Directive({
	selector: '[q-grid-vscroll-column]'
})
export class VscrollColumnDirective implements OnInit, OnDestroy {
	@Input('q-grid-vscroll-column') index: number;

	constructor(private elementRef: ElementRef, private layout: VscrollLayout) {
	}

	ngOnInit() {
		const layout = this.layout;
		const column = this.elementRef.nativeElement;
		const context = layout.context;
		const size = sizeFactory(context.settings.columnWidth, context.container, column, this.index);
		layout.setItem(this.index, size);
	}

	ngOnDestroy() {
		this.layout.removeItem(this.index);
	}
}
