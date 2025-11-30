import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { Notification } from '../../components/notification/notification';
import { Button } from "../../components/button/button";

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Notification, Button],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

}
