import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  prompt!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  correctOption!: number;
}

export class UpdateEventQuizDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @MaxLength(150)
  title!: string;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions!: QuizQuestionDto[];
}
