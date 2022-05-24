import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Pokemon } from 'src/app/models/pokemon';
import { User } from 'src/app/models/user';
import { UserStat } from 'src/app/models/userStat';
import { AuthService } from 'src/app/services/auth.service';
import { PokemonsService } from 'src/app/services/pokemons.service';
import { UserStatService } from 'src/app/services/user-stat.service';

@Component({
  selector: 'app-continue-game',
  templateUrl: './continue-game.component.html',
  styleUrls: ['./continue-game.component.scss']
})
export class ContinueGameComponent {
// public pokemon: Pokemon;
public pokemonLeft: Pokemon;
public user: User;
public pokemonRight: Pokemon;
public myTeam: Pokemon[] = [];
public myAliveTeam: Pokemon[] = [];
public isDisabled: boolean = false;
public currentDate: Date = new Date();
public userCurrentStat: UserStat;

constructor(private _pokemonService: PokemonsService, private route: ActivatedRoute,
  private cdr: ChangeDetectorRef, private router: Router, private _userStatService: UserStatService,
  private _authService: AuthService) {
  this.user = this.route.snapshot.data['users'].user; //saves the user
  this.currentStat();
  this.generateDataPokemon();
  this.attackFirst();
  cdr.detach();
  let interval = setInterval(() => {
    this.cdr.detectChanges();
    this.saveGame();
    if (this.myAliveTeam.length === 0) {
      this.router.navigate([`my-account/${this.user._id}`]);
      clearInterval(interval);
    }
  }, 1000)
}

// Generate Stat (for new game and continue)
currentStat() {
  this.userCurrentStat = this.route.snapshot.data['userStat'].userStat;
  if (this.userCurrentStat === null || this.userCurrentStat === undefined) {
    //newStat!!
    let newState = JSON.stringify({
      user: this.user._id,
      victories: 0,
      score: 0,
      round: 1,
      team: this.generateTeam()
    });

    //creating the newStat
    this._userStatService.newState(newState).subscribe(newStat => {
      this.userCurrentStat = newStat.userToUpdate;
      this.myTeam = newStat.userToUpdate.team;
      this.myAliveTeam = newStat.userToUpdate.team;
    });
    localStorage.removeItem('pokemonRight');
    localStorage.removeItem('pokemonLeftLife');
  }
  //taking the old stat
  else {
    if(this.userCurrentStat.team.length === 0){
      let newState = JSON.stringify({
        user: this.user,
        victories: this.userCurrentStat.victories,
        score: this.userCurrentStat.score,
        round: 1,
        team: this.generateTeam()
      });

      this._userStatService.editState(this.user._id,newState).subscribe(newStat => {
        this.userCurrentStat = newStat.userStat;
        this.myTeam = newStat.userStat.team;
        this.myAliveTeam = newStat.userStat.team;
      });
    } else {
      this.myTeam = this.userCurrentStat.team;
      this.myAliveTeam = this.userCurrentStat.team;
    }
    console.log(this.userCurrentStat);
  }
}

//generates a new team if userStat doesn't exist
generateTeam() {
  let myTeam: Pokemon[] = [];
  let pokemon: Pokemon = {};
  for (let i = 0; i < 3; i++) {
    pokemon = this.route.snapshot.data['pokemons'].pokemons[this.getRandomId(88)]; //we get a pokemon
    myTeam.push({
      name: pokemon.name,
      life: 100,
      speed: pokemon.speed,
      imgBack: pokemon.imgBack
    });
  }
  this.myTeam = myTeam;
  this.myAliveTeam = myTeam;
  return myTeam;
}

//currentPokemons
generateDataPokemon() {
  if(this.myAliveTeam.length!==0){
    this.pokemonLeft = this.myAliveTeam[this.myAliveTeam.length - 1];
    if (localStorage.getItem('pokemonLeftLife') !== null){
      this.pokemonLeft.life = JSON.parse(localStorage.getItem('pokemonLeftLife')); //it gives me a random pokemon alive from team
    }
    else{
      this.pokemonLeft.life = 100;
    }
    if (localStorage.getItem('pokemonRight') == null) {
      this.pokemonRight = this.route.snapshot.data['pokemons'].pokemons[this.getRandomId(88)];
      this.pokemonRight.life = 100;
      localStorage.setItem('pokemonRight', JSON.stringify(this.pokemonRight));
    } else {
      this.pokemonRight = JSON.parse(localStorage.getItem('pokemonRight'));
    }
  } else {
    this.router.navigate([`my-account/${this.user._id}`]);
  }
  
}

//gets a random number
getRandomId(max): number {
  return Math.round(Math.random() * max);
}

//gives me a pokemon that is alive
getPokemonFromTeam() {
  let pokemonAlive: Pokemon[] = [];
  this.myTeam.forEach(pokemon => {
    if (pokemon.life > 0) {
      pokemonAlive.push(pokemon);
    }
  });
  return pokemonAlive;
}

// ATTACK && DEFFENSE
enemyAtacking(): void {
  const moves = ['attack', 'defense'];
  if (this.pokemonRight.life > 0 && this.pokemonLeft.life > 0) {
    let move = moves[Math.round(Math.random() * 2)];
    switch (move) {
      case 'attack':
        if (this.pokemonLeft.life <= 20) {
          console.log('enemy attacking');
          this.pokemonLeft.life = 0;
          localStorage.removeItem('pokemonLeftLife');
        }
        else {
          console.log('enemy attacking');
          this.pokemonLeft.life = this.pokemonLeft.life-(this.pokemonLeft.life * (this.getRandomId(50)/100));
          // document.getElementById("pokemonLeft").classList.add("animate__bounceIn");
        }
        break;
      case 'defense':
        console.log('enemy defense');
        this.pokemonRight.life = this.pokemonRight.life + (this.pokemonRight.life * 0.05);
        break;
      default: this.pokemonLeft.life = this.pokemonLeft.life-(this.pokemonLeft.life * (this.getRandomId(50)/100));
    }
    this.isDisabled = false;
    // document.getElementById("pokemonRight").classList.remove("animate__bounceIn");
    localStorage.setItem('pokemonLeftLife', JSON.stringify(this.pokemonLeft.life));
  }
}

attack(): void {
  document.getElementById("pokemonLeft").classList.remove("animate__bounceIn");
  if (this.pokemonLeft.type === 'fire' && this.pokemonRight.type === 'grass'
    || this.pokemonLeft.type === 'grass' && this.pokemonRight.type === 'water'
    || this.pokemonLeft.type === 'water' && this.pokemonRight.type === 'fire') {

    if (this.pokemonRight.life <= 20) {
      // document.getElementById("pokemonRight").classList.add("animate__bounceIn");
      this.pokemonRight.life = 0;
      localStorage.removeItem('pokemonRight');
    }
    else {
      this.pokemonRight.life = this.pokemonRight.life - (this.pokemonRight.life * (this.getRandomId(80)/100));
      // document.getElementById("pokemonRight").classList.add("animate__bounceIn");
      
    }
  }
  else {
    if (this.pokemonRight.life <= 10) {
      this.pokemonRight.life = 0;
      localStorage.removeItem('pokemonRight');
    }
    else {
      this.pokemonRight.life = this.pokemonRight.life - (this.pokemonRight.life * (this.getRandomId(50)/100));
      // document.getElementById("pokemonRight").classList.add("animate__bounceIn");
    }
  }
  localStorage.setItem('pokemonRight', JSON.stringify(this.pokemonRight));
  this.isDisabled = true;
  setTimeout(function () {
    this.enemyAtacking();
  }.bind(this), 1000);

}

  defense(): void {
    // document.getElementById("pokemonLeft").classList.remove("animate__bounceIn");
    this.pokemonLeft.life = this.pokemonLeft.life + (this.pokemonLeft.life*0.05);
    localStorage.setItem('pokemonLeftLife', JSON.stringify(this.pokemonLeft.life));
    setTimeout(function () {
      this.enemyAtacking();
    }.bind(this), 1000);
  }

saveGame() {
  this._userStatService.getOneUserStats(this.user._id).subscribe(currentStatus=>{
    this.userCurrentStat = currentStatus.userStat;
  });
  let currentStatus: string = '';
  if (this.pokemonLeft.life === 0) {
    this.myAliveTeam.pop();
    currentStatus = JSON.stringify({
      user: this.userCurrentStat.user,
      victories: this.userCurrentStat.victories,
      score: this.userCurrentStat.score,
      round: this.userCurrentStat.round+1,
      team: this.myAliveTeam
    });
    this._userStatService.editState(this.user._id, currentStatus).subscribe(status => {
      this.userCurrentStat = status.status;
    });
    localStorage.removeItem('pokemonLeftLife');
    this.nextRound();
    

  } else if (this.pokemonRight.life === 0) {
    currentStatus = JSON.stringify({
      user: this.userCurrentStat.user,
      victories: this.userCurrentStat.victories + 1,
      score: this.userCurrentStat.score + this.score(),
      round: this.userCurrentStat.round+1,
      team: this.myAliveTeam
    });

    this._userStatService.editState(this.user._id, currentStatus).subscribe(status => {
      this.userCurrentStat = status.status;
    });
    localStorage.removeItem('pokemonRight');
    this.nextRound();
  }
}

score(): number {
  let sum: number = 0;
  this.myAliveTeam.forEach(pokemon =>{
    sum += pokemon.life;
  })
  return Math.round(sum);
}

nextRound(): void {
  this.generateDataPokemon();
  this.attackFirst();
}

attackFirst(): void{
  if(this.pokemonLeft.speed < this.pokemonRight.speed){
    this.isDisabled = true;
    console.log('Left is slower than right');
    this.enemyAtacking();
  }
}

}

