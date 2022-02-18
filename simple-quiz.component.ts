import {
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import _ from 'underscore';
import SharedStore from '../../../lib/shared-store';
import BrowserStorage from '../../../lib/browser-storage';

declare var require:any;


@Component({
  selector: 'simple-quiz',
  templateUrl: './simple-quiz.component.html'
})
export class SimpleQuiz {


  /**
   * Questions format:
   * [
   *   {
   *     title: "Budgeting onboarding",
   *     topContent: ["A paragraph", ...],
   *     answers: [
   *       {
   *         value: 1,
   *         label: "An answer"
   *       },
   *       {
   *          ...
   *       }
   *     ],
   *     model: null
   *   }
   *   {
   *     ...
   *   }
   * ]
   */
  @Input() questions:Array<any>;

  @Input() identifier:string;
  @Output() onCompletion: EventEmitter<any> = new EventEmitter();

  private styles:any = require('./simple-quiz.styl');
  private currentQuestionIndex:number = 0;

  constructor (
    public store:SharedStore,
    private browserStorage:BrowserStorage
  ) {
  }

  ngAfterViewInit() {
    this.validateQuestions();
    this.checkCompletion();
  }

  private checkCompletion() {
    if (this.getCurrentQuestionIndex() >= this.questions.length) {
      _.defer(() => this.onCompletion.emit());
    }
  }

  private getCurrentQuestionIndex() {
    if (!this.currentQuestionIndex) {
      this.currentQuestionIndex = 0; // default

      // Attempt to get a previous value from localStorage
      if (typeof this.identifier == 'string') {
        let val = this.browserStorage.get(this.identifier);
        if (val) this.currentQuestionIndex = parseInt(val, 10);
      }
    }
    return this.currentQuestionIndex;
  }

  private setCurrentQuestionIndex(index:number) {
    this.currentQuestionIndex = index;
    if (typeof this.identifier == 'string') this.browserStorage.set(this.identifier, index);
  }

  private nextQuestion() {
    this.setCurrentQuestionIndex(this.currentQuestionIndex + 1);
    this.checkCompletion();
  }

  public checkAnswer(question, answer) {
    if (!answer) {
      return question.bottomContent = [
        "Please select an answer"
      ];
    }
    if (answer.correct) {
      question.answeredCorrectly = true;
      if (_.isFunction(question.correctAnswerCallback)) {
        question.correctAnswerCallback();
      }
    } else {
      if (_.isFunction(question.incorrectAnswerCallback)) {
        question.incorrectAnswerCallback();
      }
    }
  }

  public validateQuestions() {
    if (!this.questions) {
      throw new Error('SimpleQuiz - The `[questions]` property is required');
    }
    if (!_.isArray(this.questions)) {
      throw new Error('SimpleQuiz - The `[questions]` property must be an array');
    }
    for (let question of this.questions) {
      if (!_.isArray(question.answers)) {
        throw new Error('SimpleQuiz#questions - Each question must contain an array of answers');
      }
      if (question.topContent && !_.isArray(question.topContent)) {
        throw new Error('SimpleQuiz#questions - The topContent attribute must be an array');
      }
      let hasCorrectAnswer = false;
      for (let answer of question.answers) {
        if (answer.correct) {
          hasCorrectAnswer = true;
        }
      }
      if (!hasCorrectAnswer) {
        throw new Error(
          `SimpleQuiz#questions - There is no correct answer for question "${question.title}"`
        );
      }
    }
  }


}
