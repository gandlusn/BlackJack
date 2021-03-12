import React from "react";
// import { BrowserRouter as Router, Route, Link, DefaultRoute} from "react-router-dom";
// import PlayingCardsList from './PlayingCard/Hand/PlayingCard/PlayingCardsList';
import './CheckCss.css';
import Hand from "./PlayingCard/Hand/Hand";
import {v4 as uuidv4} from 'uuid';


class CheckCss extends React.Component {
    constructor(props) {
        super(props);

        let Shuffle_PlayingCardsList = [];
        
        // neeed to add to state
        let players = {}
        let playerList = []
        let playerLayout = 'spread'        
        let distributed_Cards = []
        let dealerLayout = "spread"
        // let cardStatus = {}
        let suits = ['c', 'd', 'h', 's'];
        let faces = ['j', 'q', 'k'];

        let addSuits = (i, Shuffle_PlayingCardsList) => {
            for(let suit of suits){
                Shuffle_PlayingCardsList.push(i + suit)
                // cardStatus[i + suit] = "n_d"
            }
        }
        
        for(let i = 1; i < 10; i++){
            addSuits(i, Shuffle_PlayingCardsList);
        }
        
        for(let i of faces){
            addSuits(i, Shuffle_PlayingCardsList);
        }

        this.state = {  cardList : Shuffle_PlayingCardsList, 
                        // cardStatus:cardStatus, 
                        distributedCards: [...distributed_Cards],
                        layout: 'stack',
                        players:players,
                        playerList:playerList,
                        playerLayout:playerLayout,
                        dealerLayout: dealerLayout,
                        turn : -2,
                        dealerCards : [],
                        noTurnList : new Set([]),
                        dealerScore : 0,
                        gameOver : true,
                        maxPlayerScore : 0,
                        hit: "",
                        pass:""
                    };
    }

    hit = async (playerID) =>{
        await this.setState({hit:playerID})
    }
    
    pass = async (playerID) =>{
        await this.setState({pass:playerID})
    }

    calculate = async(playersID,card) =>{

        console.log("Adding adding",card,playersID)

        // Card Val Calculation
        let card_string_val = card.split("")[0];
        let val = 0

        if (card_string_val >= '0' && card_string_val <= '9') {
            val = parseInt(card_string_val);
        } else {
            val = 10;
        }

        // Dealer Calculate
        if(playersID == "dealer")
        {
            let card_string_val = card.split("")[0];
            let currentDealerScore = this.state.dealerScore;

            currentDealerScore += val;

            await this.setState({dealerScore:currentDealerScore})

            console.log("Dealer Score Updated : ",currentDealerScore)

            // if(currentDealerScore >= 21)
            // {
            //     await this.setState({gameOver:true});
            //     console.log("Game Over");
            // }
        }

        //player calculate
        else{
            let currentPlayers = {...this.state.players};
            let currentPlayer = currentPlayers[playersID];
    
            currentPlayer.Score += val;        
            console.log("Players Score Now : ",currentPlayer.Score)
            currentPlayers[playersID] = currentPlayer;
    
            await this.setState({players:currentPlayers});
    
            if(currentPlayer.Score >= 21)
            {
                console.log("Player Scored Exceeded");
                await this.addToNoTurnList(playersID);
            }
        }

        return;
    }

    addToNoTurnList = async(playersID) =>{
        let curretNoTurnList  = new Set([...this.state.noTurnList]);
        curretNoTurnList.add(playersID);
        await this.setState({noTurnList:curretNoTurnList});
        console.log("This Player is now out of any new turns",playersID);
    }

    shuffleCardList = async() => {
        var currentState = {...this.state}
        
        var array = [...currentState.cardList]

        console.log("Shuffle Started")

        // While there remain elements to shuffle...
        let shuffle = async(array) => {
            
            var currentIndex = array.length, temporaryValue, randomIndex;

            while (0 !== currentIndex) {
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
            
                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            await this.setState({cardList:array});
            
            return;
        }

        await shuffle(array);

        console.log("Shuffle Stopped")

        return;
    }

    addPlayer = async (newPlayer,chips) =>{
        if(newPlayer == null)
        {
            return;
        }

        let currentPlayers = {...this.state.players}
        let currentPlayersList = [...this.state.playerList]

        let myuuid = uuidv4();

        if(currentPlayersList.length ===  0)
        {
            //when the first player is added the game starts
            this.setState({gameOver:false});

            await this.setState({turn:0})
        }
        
        //adding new player to the list
        currentPlayers[myuuid] = {Name:newPlayer, Chips:chips, Cards:[], Score:0}
        currentPlayersList.push(myuuid)

        await this.setState({players: currentPlayers, playerList: currentPlayersList})

        console.log("Player Added",this.state.players)

        return;
    }

    moveCard = async (target) => {
        
        //taking all the state varaibles
        let curretDeck = [...this.state.cardList]
        let currentDistributedCards = [...this.state.distributedCards]       
        let top_card = curretDeck.pop()
        
        if(target === -1)
        {
            let current_dealer_cards = [...this.state.dealerCards];
            current_dealer_cards.push(top_card)

            //pushing card to dealer
            await this.setState({dealerCards:current_dealer_cards})

            console.log("dealer got new cards",this.state.dealerCards)

            // setting Distributed cards list
            currentDistributedCards.push(top_card);

            // finally updating cardList and distributed cards list
            await this.setState({cardList:curretDeck,distributedCards:currentDistributedCards})
            
            await this.calculate("dealer",top_card);

            return;
        }
        else
        {
             //assignnew values to them
            let currentPlayers = {...this.state.players}
            let playerCards = [...currentPlayers[target].Cards]
            
            // pushing card to player
            playerCards.push(top_card);
            currentPlayers[target].Cards = playerCards;
            currentDistributedCards.push(top_card);

            //setStatus
            await this.setState({cardList:curretDeck,players:currentPlayers,distributedCards:currentDistributedCards});

            console.log("Going to Calculate");

            await this.calculate(target,top_card);

            return;
        }
       
    }

    shouldDealerTakeCard = async(dealerScore) =>{
        let current_players = [...this.state.playerList];
        let min_score = 999999999;
        let max_score  = 0;

        // here I am comparing dealer scrore to the current players score and follow these rules
        // 1. if min player score less than 21 is greater than Current dealer score then surely go for the dealers chance
        // 2. if min player score is 21, then continue to deal cards 
        // 3. if max player score and agent's score is greater than min_player score, in that case we can pick a random number between 1-10 and then if the number is less than or equal to max_score-agent then we will deal the card.
        // 4. if max_player score is less than or equal to dealer score then game is over, with dealer win or push
        // 5. if min score == max_score then deal card if dealer score is less than that
        current_players.forEach(player =>{
            if(this.state.players[player].Score < min_score)
            {
                min_score = this.state.players[player].Score;
            }
            if(this.state.players[player].Score > max_score)
            {
                max_score = this.state.players[player].Score;
            }
        })

        console.log("Current Min and Max are", min_score, max_score);

        // 5th point
        if(min_score === max_score)
        {
            console.log("minscore === max score")
            if(min_score>dealerScore)
            {
                console.log("min_score is greater than dealer score")
                if(min_score>=21)
                {
                    console.log("min_score is greater than or equal to 21 then stop")
                    return false;
                }
                else
                {
                    console.log("min score is less than 21 and greater than dealer score");
                    return true;
                }
            }
            else
            {
                return false;
            }
        }
        //1st point
        if(min_score > dealerScore)
        {
            return true;
        }
        //2nd point
        if(min_score == 21)
        {
            return true;
        }
        //4th point
        if(max_score <= dealerScore)
        {
            return false;
        }
        //3rd point
        if(dealerScore > min_score)
        {
            let randInt = await this.getRandomInt();
            return randInt <= (max_score-dealerScore);
        }

        return true;
    }


    getRandomInt = () =>{
        let min = 1;
        let max = 10;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    decideTurn = async () => {

        console.log("The Turn Goes to : ", this.state.turn)
        if(this.state.turn === "")
        {
            console.log("No one to start Play")
            return;
        }

        if(this.state.turn ===  -1)
        {
            console.log("this is dealers turn")
            await this.moveCard(-1)
            console.log("then it goes to 0 player")
            await this.setState({turn: 0})
        }
        else
        {

            let currentPlayer = this.state.playerList[this.state.turn];

            console.log("Player ID : ", currentPlayer)

            if(this.state.noTurnList.has(currentPlayer))
            {
                console.log("This player is in No Turn  list : ", currentPlayer);
            }

            else
            {
                await this.moveCard(currentPlayer)
            }

            // if(this.state.noTurnList.size == this.state.playerList)
            // {
            //     console.log("Final Turn goes to dealer")
            //     await this.setState({turn: -1})
            //     return
            // }
        
            if(this.state.turn+1 >= this.state.playerList.length)
            {
                // So first we check if dealer is already dealt 2 cards or more, if not turn goes to 
                if(this.state.dealerCards.length >= 2)
                {
                    console.log("no Turn List size",this.state.noTurnList.size," then the players size", this.state.playerList.length)
                    if(this.state.noTurnList.size === this.state.playerList.length)
                    {
                        // we will come here when every one in the players is in the No Turn List, which means they didn't hit or they reached >=21 score
                        console.log("Final Turn goes to dealer")
                        // here we will check if dealer wants a turn or not
                        if(this.shouldDealerTakeCard(this.state.dealerScore) === true)
                        {
                            await this.setState({turn: -1})
                        }
                        else{
                            console.log("Dealer turn is also over");
                            this.setState({gameOver:true});
                        }
                        return
                    }
                    else
                    {
                        console.log("Turn goes to 0 index Player")
                        await this.setState({turn: 0})
                    }
                }
                else{
                    console.log("Turn goes to dealer")
                    await this.setState({turn: -1})
                }
            }
            else
            {
                console.log("Turn goes to next player")
                await this.setState({turn: this.state.turn+1})
            }

            console.log(this.state.players)
        }

        return;

    }

    decideWin = async() =>{
        let winners = [];

        console.log("decide Win Invoked");
 
        // Going through each each player Score

        let currentPlayersList = [...this.state.playerList]
        let currentPlayers = {...this.state.players}

        // if dealer score is above 21 then every one else whose score is less than or equal to 21 are winners
        if(this.state.dealerScore > 21)
        {

            currentPlayersList.forEach((playersID) =>{
                        if(currentPlayers[playersID].Score <= 21) 
                        {
                            winners.push(playersID);
                        }
                     })
        }

        // if dealer score is equal to 21, then in that all the other players that have 21 are the winners
        else if(this.state.dealerScore == 21)
        {
            winners.push("DEALER");
            currentPlayersList.forEach((playersID) =>{
                if(currentPlayers[playersID].Score == 21) 
                {
                    winners.push(playersID);
                }
             })
        }

        // finally if dealerScore is less than 21, in that case all the players that are 
        else
        {
            currentPlayersList.forEach((playersID) =>{
                if(currentPlayers[playersID].Score > this.state.dealerScore && currentPlayers[playersID].Score < 22) 
                {
                    winners.push(playersID);
                }
             })
             if(winners.length == 0)
             {
                 winners.push("Dealer");
             }
        }

        console.log("Winners : ",winners);

    }

    refreshGame = async() =>{
        console.log("Refreshing Game.....")
        
        // Refreshing Deck and removing all cards from Distributed Cards
        let Shuffle_PlayingCardsList = []; 
        let suits = ['c', 'd', 'h', 's'];
        let faces = ['j', 'q', 'k'];

        let addSuits = (i, Shuffle_PlayingCardsList) => {
            for(let suit of suits){
                Shuffle_PlayingCardsList.push(i + suit)
            }
        }
        
        for(let i = 1; i < 10; i++){
            addSuits(i, Shuffle_PlayingCardsList);
        }
        
        for(let i of faces){
            addSuits(i, Shuffle_PlayingCardsList);
        }

        //Refreshing Players Cards, Score and Not Turn List
        let currentPlayersList = [...this.state.playerList]
        let currentPlayers = {...this.state.players}
        
        currentPlayersList.forEach((playersID) =>{
            currentPlayers[playersID].Cards = [];
            currentPlayers[playersID].Score = 0;
        })

        //Additionally changing GameOverStatus to False and voiding dealer score and cards.
        await this.setState({
            players:currentPlayers,
            noTurnList : new Set([]),
            gameOver : false,
            distributedCards : [],  
            turn : 0,
            dealerCards : [],
            dealerScore : 0,
            // cardStatus : {}
            maxPlayerScore :0,
            gameOver:false
        })
    }

    _getCardSize = () =>{
        // console.log("window: ", window.innerWidth);
        // console.log('handsize', this.state.cardList.length)
        // console.log("size: ", window.innerWidth / this.state.cardList.length)
        let cardSize = window.innerWidth / this.state.cardList.length;
        return this.state.layout !== "spread" || cardSize > 100 ? 100 : cardSize;
    }

    render() {

        var playerCards = this.state.playerList.map((playersID,index)=>{
            return <div className="player" key = {playersID}>
                        <Hand playerType="player" key ={playersID} hide={false} layout={this.state.playerLayout} cards={this.state.players[playersID].Cards} cardSize={this._getCardSize()}/>
                </div>;
        })

        if(this.state.gameOver)
        {
            this.decideWin();
        }

        return(
            <div className="main"> 
                    {/* <div className="deck">
                        <Hand hide={true} layout={this.state.layout} cards={this.state.cardList} cardSize={this._getCardSize()}/>
                    </div> */}
                    <div className="dealer">
                        <Hand playerType="dealer" hide={false} layout={this.state.dealerLayout} cards={this.state.dealerCards} cardSize={this._getCardSize()}/>
                    </div>

                    {playerCards}
                    
                    <button onClick = {() => this.addPlayer("Sai Kishan")} >Add Player</button>
                    <button onClick={() => this.decideTurn()} disabled={this.state.gameOver}>Turn</button>
                    <button onClick={() => this.shuffleCardList()}>Shuffle</button>
                    <button onClick={() => this.refreshGame()}>Refresh</button>
            </div>
        );
    }
  }

export default CheckCss;