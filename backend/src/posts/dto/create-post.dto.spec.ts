import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePostDto } from './create-post.dto';

describe('CreatePostDto', () => {
  it('passes validation with a valid title and content', async () => {
    const dto = plainToInstance(CreatePostDto, {
      title: 'Hello world',
      content: 'This is my first post.',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when title or content is empty', async () => {
    const dto = plainToInstance(CreatePostDto, { title: '', content: '' });

    const errors = await validate(dto);

    const properties = errors.map((error) => error.property);
    expect(properties).toEqual(expect.arrayContaining(['title', 'content']));
  });

  it('fails validation when title exceeds 255 characters', async () => {
    const dto = plainToInstance(CreatePostDto, {
      title: 'a'.repeat(256),
      content: 'valid content',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('fails validation when content exceeds 5000 characters', async () => {
    const dto = plainToInstance(CreatePostDto, {
      title: 'valid title',
      content: 'a'.repeat(5001),
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'content')).toBe(true);
  });
});
