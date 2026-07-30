import { ArrayMaxSize, IsArray, IsInt, Min } from 'class-validator';

export class SubmitQuizAttemptDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(0, { each: true })
  answers!: number[];
}
