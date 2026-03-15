import React from "react";
import Image from "next/image";
import { Accordion } from "react-bootstrap";
import { contactFormFields } from "@/data/contactData";
import { Comment, ContactFormField } from "./types";

interface ReviewsSectionProps {
  comments: Comment[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ comments, onSubmit }) => {
  const formFields = contactFormFields as ContactFormField[];
  const [rating, setRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Add rating to the form data implicitly by being in the form? No, we need a hidden input or append it.
    // Since onSubmit prop expects FormEvent, let's keep it simple and ensure a hidden input exists.
    onSubmit(e);
  };

  return (
    <>
      {/* Comments */}
      <div className='tour-listing-details__content__item tour-listing-details__reviews'>
        <h3
          className='tour-listing-details__title wow fadeInUp animated '
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          {comments.length} Reviews
        </h3>
        {comments.length > 0 ? (
          <ul className='list-unstyled product-details__comment__list'>
            {comments.map((comment, index) => (
              <li
                key={index}
                className='product-details__comment__card wow fadeInUp animated'
                data-wow-delay='100ms'
                data-wow-duration='1500ms'
              >
                <div className='product-details__comment__card__image'>
                  <Image 
                    src={comment.avatar} 
                    alt={comment.name} 
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: '50%' }}
                  />
                </div>
                <div className='product-details__comment__card__content'>
                  <div className='product-details__comment__card__top'>
                    <div className='product-details__comment__card__info'>
                      <h3 className='product-details__comment__card__title'>
                        {comment.name}
                      </h3>
                      <p className='product-details__comment__card__date'>
                        {comment.date}
                      </p>
                    </div>
                    <div className='product-details__comment__card__star'>
                      {[...Array(5)].map((_, idx) => (
                        <span key={idx} className={`fa fa-star ${idx < (comment.rating || 5) ? 'active' : ''}`} style={{ color: idx < (comment.rating || 5) ? '#b79c5c' : '#ddd' }}></span>
                      ))}
                    </div>
                  </div>
                  <p className='product-details__comment__card__text'>
                    {comment.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No reviews yet. Be the first to review!</p>
        )}
      </div>

      {/* Add Review Form */}
      <div className='tour-listing-details__content__item tour-listing-details__add-reviews'>
        <div className='contact-page__contact'>
          <h2 className='tour-listing-details__title wow fadeInUp animated'>
            Add a Review
          </h2>
          <form
            className='comments-form__form contact-form-validated product-details__form__form form-one wow fadeInUp animated'
            onSubmit={handleSubmit}
          >
            <div
              className='product-details__form-ratings wow fadeInUp animated'
              data-wow-duration='1500ms'
              data-wow-delay='500ms'
            >
              <p className='product-details__form-ratings__label'>
                Your Rating*
              </p>
              <div className="stars">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <span 
                      key={index} 
                      className={`fa fa-star ${(hoverRating || rating) >= starValue ? 'active' : ''}`}
                      style={{ 
                        color: (hoverRating || rating) >= starValue ? '#b79c5c' : '#ddd',
                        cursor: 'pointer',
                        marginRight: '5px',
                        fontSize: '18px'
                      }}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starValue)}
                    ></span>
                  );
                })}
              </div>
              <input type="hidden" name="rating" value={rating} />
            </div>

            <div className='form-one__group'>
              {formFields.map((field, index) => (
                <div
                  key={index}
                  className={`form-one__control ${
                    field.type === "textarea"
                      ? "form-one__control--full"
                      : ""
                  }`}
                >
                  <label htmlFor={field.name}>{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      id={field.name}
                      placeholder={field.placeholder}
                      required
                    ></textarea>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      id={field.name}
                      placeholder={field.placeholder}
                      required
                    />
                  )}
                </div>
              ))}
              <div className='form-one__control form-one__control--full'>
                <button
                  type='submit'
                  className='gotur-btn gotur-btn--base'
                >
                  Submit Review <i className='icon-arrow-right'></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
