import { Component, OnInit, inject } from '@angular/core';
import { ApplicationService } from '@app/global-services';
//import { Domain } from '@app/shared/model/admin';
//import { SweetAlert2LoaderService } from '@sweetalert2/ngx-sweetalert2';
import { RouterLink } from '@angular/router';

@Component({
    selector   : 'app-landing',
    templateUrl: './landing.component.html',
    styleUrls  : ['./landing.component.scss', '../../app.scss'],
    imports    : [
        RouterLink
    ]
})
export class LandingComponent implements OnInit {
    //private userService = inject(UserService);
    //private sweetAlert2LoaderService = inject(SweetAlert2LoaderService);
    private applicationService = inject(ApplicationService);

    ngOnInit() {
        this.applicationService.updateModule('');
        //this.getGlobalAlert();
    }

    /*getGlobalAlert() {
        this.userService.retrieveAlert().then(
            async data => {
                //display this data in tab.
                if (data && !data.isDeleted) {
                    const swal = await this.sweetAlert2LoaderService.swal;
                    swal.fire({icon: 'info', text: data.text});
                }
            },
            error => {
                // TODO : Display the appropriate message to the user.
            });
    }*/

}
